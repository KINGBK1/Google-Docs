import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";

// Models
import DocumentModel from "./models/DocumentSchema.js";
import User from "./models/UserSchema.js"; 

// Routes
import authRoutes from "./routes/authRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js"

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
app.use("/api" , uploadRoutes)

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  let currentDocumentId = null;
  socket.on("get-document", async ({ documentId, userId }) => {
    try {
      if (!documentId) return; // didn't get the id  
      
      currentDocumentId = documentId;
      let document = await DocumentModel.findById(documentId);

      if (!document) {
        document = await DocumentModel.create({
          _id: documentId,
          name: "Untitled Document",
          content: {},
        });
      }

      if (userId) { // if user id exists then i will be finding this user id in my mongo db User collection and storing it in the 'user' variable as we can se in the next line 
        const user = await User.findById(userId);
        if (user && !user.documents.includes(documentId)) { // if user user exists in the collection and the document array does not contains the document id that we just emitted from our backend we created in the User model then we will insert this new document id in the array 
          user.documents.push(documentId);
          await user.save(); // save it to the collection 
        }
      }

      socket.join(documentId);
      socket.emit("load-document", {
        content: document.content,
        name: document.name,
      }); // sending this document to the frontend
    } catch (error) {
      console.error(`[Server] Error in 'get-document' for ID ${documentId}:`, error);
    }
  });

  socket.on("send-changes", (delta) => {
    if (!currentDocumentId) {
      console.warn("[Server] No documentId stored for socket. Cannot emit changes.");
      return;
    }
    socket.to(currentDocumentId).emit("receive-changes", delta);
  });

  socket.on("save-document", async (data) => {
    const { documentId, content, name } = data;
    if (!documentId) {
      console.error("[Server] ERROR: 'documentId' is missing. Aborting save.");
      return;
    }
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
    } catch (error) {
      console.error(`[Server] ERROR saving document ${documentId}:`, error);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
