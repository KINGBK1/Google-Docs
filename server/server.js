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
import ChatModel from './models/chatSchema.js';

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
  const token = socket.handshake.headers.cookie
    ?.split('; ')
    .find(row => row.startsWith('token='))
    ?.split('=')[1];

  if (!token) return next(new Error('Authentication error'));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    console.error("Invalid token:", err);
    next(new Error('Invalid token'));
  }
});

// Main Socket.IO Events
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);
  let currentDocumentId = null;

  // Document Join Handler
  socket.on('get-document', async ({ documentId, userId }) => {
    try {
      let document = await DocumentModel.findById(documentId).populate('allowedUsers');

      if (!document) {
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
        return socket.emit('load-document', {
          isRestricted: true,
          isAllowed: false,
        });
      }

      currentDocumentId = documentId;
      socket.join(documentId);

      // Sending entire document + chat messages
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
    if (!documentId || !message.trim()) return;

    const chatMessage = {
      sender: socket.user?.name || socket.id,
      text: message,
      timestamp: new Date(),
    };

    try {
      await DocumentModel.findByIdAndUpdate(documentId, {
        $push: { chatMessages: chatMessage },
      });

      console.log(`[Chat] ${chatMessage.sender}:`, chatMessage.text);

      // Broadcast to others
      io.to(documentId).emit('receive-chat-message', chatMessage);
    } catch (err) {
      console.error('Error saving chat message:', err);
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
    console.log('Socket disconnected:', socket.id);
  });
});

// Start Server
server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
