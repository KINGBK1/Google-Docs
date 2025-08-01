import express from "express";
import { googleLogin } from "../controllers/authController.js";
import authMiddleware from "../middlewares/AuthMiddleware.js";
// import jwt from 'jsonwebtoken'
const router = express.Router();

router.post("/google-login", googleLogin);
router.get("/status",authMiddleware ,(req, res) => { // the real status check happens in the auth middleware 
  res.json({ user: req.user }); // sending the user data from the middleware not from the controller 
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
