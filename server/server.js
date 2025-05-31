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
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });

  socket.on("get-document", async (documentId) => {
    try {
      let document = await DocumentModel.findById(documentId);

      if (!document) {
        const newDocument = new DocumentModel({ _id: documentId });
        await newDocument.save();
        document = newDocument;
      }

      socket.join(documentId);
      socket.emit("load-document", { content: document.content, name: document.name });
    } catch (error) {
      console.error("Error fetching or creating document:", error);
    }
  });

  socket.on("send-changes", (delta) => {
    socket.to(socket.rooms).emit("receive-changes", delta);
  });

  socket.on("save-document", async (data) => {
    const { documentId, content, name } = data;
    try {
      const updatedDocument = await DocumentModel.findByIdAndUpdate(
        documentId,
        { content: content, name: name, updatedAt: Date.now() },
        { new: true, upsert: true }
      );
      if (updatedDocument) {
        console.log(`Document ${documentId} updated successfully. New name: ${updatedDocument.name}`);
      }
    } catch (error) {
      console.error("Error saving document:", error);
    }
  });
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
