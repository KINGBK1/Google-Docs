import express from "express";
import { googleLogin } from "../controllers/authController.js";
import authMiddleware from "../middlewares/AuthMiddleware.js";
import jwt from 'jsonwebtoken'
const router = express.Router();

router.post("/google", googleLogin);
router.get("/status", (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ user: decoded });
  } catch (err) {
    console.error("Auth status error:", err);
    res.status(500).json({ message: "Failed to verify token" });
  }
});


export default router;
