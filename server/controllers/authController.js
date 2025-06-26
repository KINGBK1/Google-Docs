import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import User from "../models/UserSchema.js";
import {google} from "googleapis";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLogin = async (req, res) => {
  const { token, access_token } = req.body; // destructuring the token var that is once the token is found in the body
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    res.cookie("g_access_token", access_token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 60 * 60 * 1000,
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
        picture: user.picture,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    console.log("Generated JWT token:", jwtToken);
    res.cookie("token", jwtToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 60 * 60 * 1000,
    });
    console.log("Cookie set with token:", jwtToken);

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

export const uploadToDrive = async (req, res) => {
    const { documentName = "Untitled Document", content = "" } = req.body;
  const accessToken = req.cookies.g_access_token;

    if (!accessToken) {
    return res.status(401).json({ message: "Missing Google Access Token" });
  }

    try {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const drive = google.drive({ version: "v3", auth: oauth2Client });

    const fileMetadata = {
      name: `${documentName}.txt`,  // or .docx, .md etc.
    };

      const media = {
      mimeType: "text/plain",
      body: content,
    };

        const file = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: "id, name, webViewLink",
    });

    res.status(200).json({
      message: "Uploaded to Google Drive successfully",
      file: file.data,
    });
  } catch (err) {
    console.error("Google Drive upload error:", err);
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
};
