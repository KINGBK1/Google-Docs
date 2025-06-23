
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

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
app.set('trust proxy', 1);

// Middleware for request logging
app.use((req, res, next) => {
  console.log("Incoming request:", req.method, req.url, "Origin:", req.get('Origin'));
  next();
});

// CORS Configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://google-docs-7mav.vercel.app',
  'https://*.vercel.app',
  'https://google-docs-99d3.onrender.com',
];

app.use(cors({
  origin: (origin, callback) => {
    console.log("CORS request origin:", origin);
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Middleware
app.use(express.static('public'));
app.use(cookieParser());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api", uploadRoutes);
app.use("/api/gemini", geminiRoute);

// HTTP & Socket.IO setup
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Socket.IO Authentication Middleware
io.use(async (socket, next) => {
  const token = socket.handshake.headers.cookie
    ?.split('; ')
    .find(row => row.startsWith('token='))
    ?.split('=')[1];
  console.log("Socket handshake cookies:", socket.handshake.headers.cookie);
  if (!token) return next(new Error('Authentication error'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    console.error("Socket token verification error:", err);
    next(new Error('Invalid token'));
  }
});

// Socket.IO Events
io.on('connection', (socket) => {
  console.log('🔌 Socket connected:', socket.id);
  let currentDocumentId = null;

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

      socket.emit('load-document', {
        content: document.content,
        name: document.name,
        isRestricted: document.isRestricted,
        isAllowed: true,
      });

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

  socket.on('send-changes', (delta) => {
    if (!currentDocumentId) return;
    socket.to(currentDocumentId).emit('receive-changes', delta);
  });

  socket.on('save-document', async ({ documentId, content, name }) => {
    if (!documentId) return;
    try {
      await DocumentModel.findByIdAndUpdate(
        documentId,
        { name: name || 'Untitled Document', content: content || {}, updatedAt: Date.now() },
        { new: true, upsert: true, runValidators: true }
      );
    } catch (err) {
      console.error(`[Server] save-document error: ${documentId}`, err);
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ Socket disconnected:', socket.id);
  });
});

// Start Server
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});