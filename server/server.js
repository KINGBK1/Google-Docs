import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";

// Models
import DocumentModel from "./models/DocumentSchema.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";

// Config
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("get-document", async (documentId) => {
    try {
      let document = await DocumentModel.findById(documentId);
      if (!document) {
        const newDocument = new DocumentModel({
          _id: documentId,
          name: 'Untitled Document',
          content: {},
        });
        await newDocument.save();
        document = newDocument;
      }
      socket.join(documentId);
      socket.emit("load-document", { content: document.content, name: document.name });
    } catch (error) {
      console.error(`[Server] Error in 'get-document' for ID ${documentId}:`, error);
    }
  });

  socket.on("send-changes", (delta) => {
    socket.to(socket.rooms).emit("receive-changes", delta);
  });

  socket.on("save-document", async (data) => {
    const { documentId, content, name } = data;
    if (!documentId) {
      console.error("[Server] ERROR: 'documentId' is missing in 'save-document' event data. Aborting save.");
      return;
    }
    try {
      const updatePayload = {
        name: name || 'Untitled Document',
        content: content || {},
        updatedAt: Date.now()
      };
      const updatedDocument = await DocumentModel.findByIdAndUpdate(
        documentId,
        updatePayload,
        { new: true, upsert: true, runValidators: true }
      );
      if (!updatedDocument) {
        console.error(`[Server] CRITICAL ERROR: Document ${documentId} - findByIdAndUpdate returned null/undefined even with upsert:true. Document NOT saved/created.`);
      }
    } catch (error) {
      console.error(`[Server] ERROR saving document ${documentId} to MongoDB:`, error);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});