import express from "express";
import { googleLogin } from "../controllers/authController.js";
import authMiddleware from "../middlewares/AuthMiddleware.js";
import jwt from 'jsonwebtoken'
const router = express.Router();

router.post("/google-login", googleLogin);
router.get("/status",authMiddleware ,(req, res) => {
  res.json({ user: req.user });
});


router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,      
    secure: true,        
    sameSite: "None",    
  }).status(200).json({ message: "Logged out successfully" });
});

router.get("/ping", (req, res) => {
  res.send("pong");
});


export default router;
