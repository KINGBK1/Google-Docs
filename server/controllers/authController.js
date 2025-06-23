import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import User from "../models/UserSchema.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLogin = async (req, res) => {
  const { token } = req.body; // destructuring the token var that is once the token is found in the body 
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub, email, name, picture } = payload;

    let user = await User.findOne({ googleId: sub });
    if (!user) {
      user = new User({ googleId: sub, email, name, picture });
      await user.save();
    } else if (!user.picture) {
      user.picture = picture;
      await user.save();
    }

    const jwtToken = jwt.sign(
      {
        id: user._id,
        email: user.email,
        name: user.name,
        picture: user.picture, // 👈 Add this
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("token", jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",  // only true on deploy
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      maxAge: 60 * 60 * 1000,
    });

  res.status(200).json({
    message: "Login successful",
    // token: jwtToken,
    user: {
      name: user.name,
      email: user.email,
      picture: user.picture,
    },
  });
} catch (error) {
  console.error("Error verifying Google token:", error);
  res.status(401).json({ message: "Invalid Google token" });
}
};
