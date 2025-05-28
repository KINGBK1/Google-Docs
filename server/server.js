import express from "express";
import cors from "cors";
import { OAuth2Client } from "google-auth-library";
import mongoose from "mongoose";
import dotenv from "dotenv";
import jwt from "jsonwebtoken"; // NEW

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
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

// Auth route (verify Google token and issue your own JWT)
app.post("/api/auth/google", async (req, res) => {
  const { token } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub, email, name } = payload;

    // Save or find user in DB
    let user = await User.findOne({ googleId: sub });
    if (!user) {
      user = new User({ googleId: sub, email, name });
      await user.save();
    }

    // Issue your own JWT with user id and email as payload
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

// Middleware to protect private routes (verifies your JWT)
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

// Example protected route
app.get("/api/private-data", authMiddleware, (req, res) => {
  res.json({ secret: "This is protected data", user: req.user });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
