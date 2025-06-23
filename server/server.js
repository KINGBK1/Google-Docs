// server.js

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
import geminiRoute from "./routes/geminiRoute.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
app.set('trust proxy', 1);

// ✅ CORS Configuration (dynamic & safe)
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://google-docs-99d3.onrender.com",
  "https://google-docs-7mav-nommqs1a9-kingbk1s-projects.vercel.app",
  "https://google-docs-7mav-git-main-kingbk1s-projects.vercel.app",
  "https://google-docs-7mav-gv4sbinvh-kingbk1s-projects.vercel.app",
  "https://google-docs-7mav.vercel.app",
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

// ✅ Middleware
app.use(express.static("public"));
app.use(cookieParser());
app.use(express.json());

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// ✅ API Routes
app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api", uploadRoutes);
app.use("/api/gemini", geminiRoute);

// ✅ HTTP & Socket.IO setup
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ✅ Socket.IO Events
io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);
  let currentDocumentId = null;

  socket.on("get-document", async ({ documentId, userId }) => {
    try {
      let document = await DocumentModel.findById(documentId).populate("allowedUsers");

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

  socket.on("save-document", async ({ documentId, content, name }) => {
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
    console.log("❌ Socket disconnected:", socket.id);
  });
});

// ✅ Start Server
server.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
