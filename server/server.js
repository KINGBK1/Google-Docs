import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import cookieParser from "cookie-parser";

import DocumentModel from "./models/DocumentSchema.js";
import User from "./models/UserSchema.js";

import authRoutes from "./routes/authRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Enable CORS with credentials (must be first, before routes)
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173"],
  credentials: true,
}));

// Static folder for serving frontend assets or confirmation pages
app.use(express.static('public'));

// Parse cookies and JSON
app.use(cookieParser());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Mount API routes
app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api", uploadRoutes);

// Create server and initialize Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Handle Socket.IO connections
io.on("connection", (socket) => {
  console.log(" Socket connected:", socket.id);
  let currentDocumentId = null;

  socket.on("get-document", async ({ documentId, userId }) => {
    try {
      let document = await DocumentModel.findById(documentId).populate("allowedUsers");

      // Create document if it doesn't exist
      if (!document) {
        document = await DocumentModel.create({
          _id: documentId,
          name: "Untitled Document",
          content: {},
          owner: userId,
          isRestricted: false,
          allowedUsers: [userId],
        });
      }

      const isOwner = document.owner && document.owner.equals(userId);
      const isAllowed = document.allowedUsers.some(user => user._id.equals(userId));

      if (document.isRestricted && !isOwner && !isAllowed) {
        return socket.emit("load-document", {
          isRestricted: true,
          isAllowed: false,
        });
      }

      currentDocumentId = documentId;
      socket.join(documentId);

      socket.emit("load-document", {
        content: document.content,
        name: document.name,
        isRestricted: document.isRestricted,
        isAllowed: true,
      });

      // Save document ID to user's history if not already saved
      if (userId) {
        const user = await User.findById(userId);
        if (user && !user.documents.includes(documentId)) {
          user.documents.push(documentId);
          await user.save();
        }
      }
    } catch (err) {
      console.error("[Socket] get-document error:", err);
      socket.emit("error", { message: "Internal server error" });
    }
  });

  socket.on("send-changes", (delta) => {
    if (!currentDocumentId) return;
    socket.to(currentDocumentId).emit("receive-changes", delta);
  });

  socket.on("save-document", async (data) => {
    const { documentId, content, name } = data;
    if (!documentId) return;

    try {
      await DocumentModel.findByIdAndUpdate(
        documentId,
        {
          name: name || "Untitled Document",
          content: content || {},
          updatedAt: Date.now(),
        },
        { new: true, upsert: true, runValidators: true }
      );
    } catch (err) {
      console.error(`[Server] save-document error: ${documentId}`, err);
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// Start the server
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
