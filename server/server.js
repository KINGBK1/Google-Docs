// server/server.js
import express from "express";
import cors from "cors";
import { OAuth2Client } from "google-auth-library";
import mongoose from "mongoose";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import http from "http";
import { Server } from "socket.io";
import { v4 as uuidv4 } from 'uuid'; // Import for generating unique IDs

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Google OAuth client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// User model
const userSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true },
  email: String,
  name: String,
});
const User = mongoose.model("User", userSchema);

// ✅ Updated content field to store Quill delta format and added name
const documentSchema = new mongoose.Schema({
  _id: String,
  name: { type: String, required: true, default: 'Untitled Document' }, // Default name
  content: { type: Object, default: {} }, // 👈 delta format
  updatedAt: { type: Date, default: Date.now },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});
const Document = mongoose.model("Document", documentSchema);

// Auth route
app.post("/api/auth/google", async (req, res) => {
  const { token } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub, email, name } = payload;

    let user = await User.findOne({ googleId: sub });
    if (!user) {
      user = new User({ googleId: sub, email, name });
      await user.save();
    }

    const jwtToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({ message: "Login successful", user, token: jwtToken });
  } catch (error) {
    console.error("Error verifying token:", error);
    res.status(401).json({ message: "Invalid token" });
  }
});

// Middleware for JWT
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No token provided" });
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Create document (you might still use this from a dashboard)
app.post("/api/documents", authMiddleware, async (req, res) => {
  const { documentId, name } = req.body;
  if (!documentId || !name) return res.status(400).json({ message: "documentId and name are required" });

  try {
    const newDoc = await Document.create({
      _id: documentId,
      name: name, // Include the name here
      content: {}, // initial empty delta
      owner: req.user.id,
    });
    res.status(201).json(newDoc);
  } catch (err) {
    console.error("Document creation failed:", err);
    res.status(500).json({ message: "Server error creating document" });
  }
});

// Get a single document by ID
app.get("/api/documents/:id", authMiddleware, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.status(200).json(doc);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get all documents owned by logged-in user
app.get("/api/my-docs", authMiddleware, async (req, res) => {
  try {
    const docs = await Document.find({ owner: req.user.id }).sort({ updatedAt: -1 });
    res.status(200).json(docs);
  } catch (err) {
    console.error("Failed to get docs:", err);
    res.status(500).json({ message: "Server error fetching documents" });
  }
});

// HTTP Server
const server = http.createServer(app);

// Socket.IO
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
      let document = await Document.findById(documentId);

      if (!document) {
        const newDocument = new Document({ _id: documentId, owner: socket.user ? socket.user.id : null });
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
      const updatedDocument = await Document.findByIdAndUpdate(
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