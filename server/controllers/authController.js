import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import User from "../models/UserSchema.js";

export const googleLogin = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: "Missing access token" });
  }

  try {
    const client = new OAuth2Client();
    const ticket = await client.getTokenInfo(token); // token verification

    const { sub: googleId, email } = ticket;

    const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();

    const { name, picture } = data;

    let user = await User.findOne({ googleId });
    if (!user) {
      user = new User({ googleId, email, name, picture });
      await user.save();
    }

    const jwtToken = jwt.sign(
      {
        _id: user._id,
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("token", jwtToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "Login successful",
      user: {
        name: user.name,
        email: user.email,
        picture: user.picture,
      },
    });
  } catch (error) {
    console.error("Token verification failed:", error);
    res.status(401).json({ message: "Failed to authenticate with Google" });
  }
};
