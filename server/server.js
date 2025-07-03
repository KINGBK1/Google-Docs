import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';

import DocumentModel from './models/DocumentSchema.js';
import User from './models/UserSchema.js';

import authRoutes from './routes/authRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import geminiRoute from './routes/geminiRoute.js';
import driveRoute from './routes/driveRoutes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Security Headers
app.set('trust proxy', 1);
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});

// Logging
app.use((req, res, next) => {
  console.log("Request:", req.method, req.url, "Origin:", req.get('Origin'));
  next();
});

// CORS Config
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://google-docs-7mav.vercel.app',
  'https://google-docs-99d3.onrender.com',
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('❌ Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Middleware
app.use(express.static('public'));
app.use(cookieParser());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api", uploadRoutes);
app.use("/api/gemini", geminiRoute);
app.use("/api/drive", driveRoute);

// HTTP + Socket.IO Setup
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Socket.IO Auth Middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.headers.cookie
      ?.split('; ')
      .find(row => row.startsWith('token='))
      ?.split('=')[1];

    if (!token) {
      console.log('No token provided');
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch user details from database
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new Error('User not found'));
    }

    socket.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      picture: user.picture
    };
    
    console.log('User authenticated:', socket.user.name);
    next();
  } catch (err) {
    console.error("Authentication error:", err);
    next(new Error('Invalid token'));
  }
});

// Main Socket.IO Events
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id, 'User:', socket.user?.name);
  let currentDocumentId = null;

  // Document Join Handler
  socket.on('get-document', async ({ documentId, userId }) => {
    try {
      console.log('get-document request:', { documentId, userId, socketUser: socket.user?.id });
      
      let document = await DocumentModel.findById(documentId).populate('allowedUsers');

      if (!document) {
        console.log('Creating new document:', documentId);
        document = await DocumentModel.create({
          _id: documentId,
          name: 'Untitled Document',
          content: {},
          owner: userId,
          isRestricted: false,
          allowedUsers: [userId],
          mode: "editing",
          chatMessages: [],
        });
      }

      const isOwner = document.owner && document.owner.equals(userId);
      const isAllowed = document.allowedUsers.some(user => user._id.equals(userId));

      if (document.isRestricted && !isOwner && !isAllowed) {
        console.log('User not allowed to access document');
        return socket.emit('load-document', {
          isRestricted: true,
          isAllowed: false,
        });
      }

      currentDocumentId = documentId;
      socket.join(documentId);
      console.log('User joined document room:', documentId);

      // Send document data including chat messages
      socket.emit('load-document', {
        content: document.content,
        name: document.name,
        isRestricted: document.isRestricted,
        isAllowed: true,
        mode: document.mode,
        chatMessages: document.chatMessages || [],
      });

      // Link user to doc if not already linked
      if (userId) {
        const user = await User.findById(userId);
        if (user && !user.documents.includes(documentId)) {
          user.documents.push(documentId);
          await user.save();
        }
      }

    } catch (err) {
      console.error('[Socket] get-document error:', err);
      socket.emit('error', { message: 'Internal server error' });
    }
  });

  // Save Chat Message
  socket.on('send-chat-message', async ({ documentId, message }) => {
    try {
      console.log('Received chat message:', { documentId, message, user: socket.user?.name });
      
      if (!documentId || !message.trim()) {
        console.log('Invalid message data');
        return;
      }

      if (!socket.user) {
        console.log('User not authenticated');
        return socket.emit('error', { message: 'User not authenticated' });
      }

      const chatMessage = {
        sender: socket.user.name,
        text: message.trim(),
        timestamp: new Date(),
      };

      // Save to database
      const updatedDocument = await DocumentModel.findByIdAndUpdate(
        documentId,
        { $push: { chatMessages: chatMessage } },
        { new: true }
      );

      if (!updatedDocument) {
        console.log('Document not found');
        return socket.emit('error', { message: 'Document not found' });
      }

      console.log(`[Chat] ${chatMessage.sender}: ${chatMessage.text}`);

      // Broadcast to all users in the document room (including sender)
      io.to(documentId).emit('receive-chat-message', chatMessage);

    } catch (err) {
      console.error('Error saving chat message:', err);
      socket.emit('error', { message: 'Error saving message' });
    }
  });

  // Text Content Changes
  socket.on('send-changes', (delta) => {
    if (!currentDocumentId) return;
    socket.to(currentDocumentId).emit('receive-changes', delta);
  });

  // Save Document Content
  socket.on('save-document', async ({ documentId, content, name }) => {
    if (!documentId) return;
    try {
      await DocumentModel.findByIdAndUpdate(
        documentId,
        {
          name: name || 'Untitled Document',
          content: content || {},
          updatedAt: Date.now(),
        },
        { new: true, upsert: true, runValidators: true }
      );
    } catch (err) {
      console.error(`[Server] save-document error: ${documentId}`, err);
    }
  });

  // Disconnect Cleanup
  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id, 'User:', socket.user?.name);
    if (currentDocumentId) {
      socket.leave(currentDocumentId);
    }
  });
});

// Start Server
server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
