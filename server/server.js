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
  .then(() => console.log("MongoDB connected")) // Crucial: Make sure this log appears
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
    console.log(`[Server] Received 'get-document' for ID: ${documentId}`);
    try {
      let document = await DocumentModel.findById(documentId);

      if (!document) {
        console.log(`[Server] Document not found for ID: ${documentId}. Creating new one.`);
        const newDocument = new DocumentModel({ _id: documentId }); // Name will use schema default
        await newDocument.save();
        document = newDocument;
        console.log(`[Server] New document ${documentId} created with name: ${document.name}`);
      } else {
        console.log(`[Server] Found document ${documentId} with name: ${document.name}`);
      }

      socket.join(documentId);
      socket.emit("load-document", { content: document.content, name: document.name });
    } catch (error) {
      console.error(`[Server] Error in 'get-document' for ID ${documentId}:`, error);
    }
  });

  socket.on("send-changes", (delta) => {
    // For debugging, you might want to know which room it's going to.
    // socket.rooms is a Set, the first element is often the socket.id, the second (if joined) is the documentId.
    // const targetRoom = Array.from(socket.rooms)[1];
    // console.log(`[Server] Relaying 'send-changes' to room: ${targetRoom}`);
    socket.to(socket.rooms).emit("receive-changes", delta);
  });

  socket.on("save-document", async (data) => {
    // 1. Log the raw data received from the client
    console.log("[Server] Received 'save-document' event with data:", JSON.stringify(data));

    const { documentId, content, name } = data;

    // 2. Validate essential data
    if (!documentId) {
      console.error("[Server] ERROR: 'documentId' is missing in 'save-document' event data. Aborting save.");
      return;
    }
    if (name === undefined || name === null) {
        console.warn(`[Server] WARNING: 'name' is missing or null in 'save-document' for ID ${documentId}. Saving with current name or default.`);
        // Allow saving without name if you wish, or handle as an error
    }
    if (content === undefined) {
        console.warn(`[Server] WARNING: 'content' is missing in 'save-document' for ID ${documentId}. Saving with empty content or current content.`);
    }

    try {
      console.log(`[Server] Attempting to save document. ID: ${documentId}, Name: "${name}"`);
      
      const updatePayload = {
        name: name, // Ensure name is explicitly included
        content: content,
        updatedAt: Date.now()
      };

      // 3. Log the exact payload being sent to MongoDB
      console.log("[Server] Update payload for MongoDB:", JSON.stringify(updatePayload));

      const updatedDocument = await DocumentModel.findByIdAndUpdate(
        documentId,
        updatePayload,
        { new: true, upsert: true, runValidators: true } // Added runValidators
      );

      // 4. Check the result of the MongoDB operation
      if (updatedDocument) {
        console.log(`[Server] SUCCESS: Document ${documentId} processed. DB Name: "${updatedDocument.name}", DB ID: ${updatedDocument._id}, UpdatedAt: ${updatedDocument.updatedAt}`);
      } else {
        // This case should be rare with upsert:true and new:true, as it should either update or insert.
        // If it occurs, it means the operation didn't result in a document, which is problematic.
        console.error(`[Server] CRITICAL ERROR: Document ${documentId} - findByIdAndUpdate returned null/undefined even with upsert:true. Document NOT saved/created.`);
      }
    } catch (error) {
      // 5. Log any errors from the MongoDB operation
      console.error(`[Server] ERROR saving document ${documentId} to MongoDB:`, error);
      console.error(`[Server] Error Name: ${error.name}, Message: ${error.message}, Code: ${error.code}`);
    }
  });
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});