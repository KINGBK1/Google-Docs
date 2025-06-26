import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import User from "../models/UserSchema.js";
import { google } from "googleapis";

export const googleLogin = async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ message: "Missing authorization code" });
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.REDIRECT_URI
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Optionally fetch user info
    const oauth2 = google.oauth2({ auth: oauth2Client, version: 'v2' });
    const { data } = await oauth2.userinfo.get();

    const { id: googleId, email, name, picture } = data;

    // Upsert user in DB
    let user = await User.findOne({ googleId });
    if (!user) {
      user = new User({ googleId, email, name, picture });
      await user.save();
    } else if (!user.picture) {
      user.picture = picture;
      await user.save();
    }

    // Issue custom JWT
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

    // Set cookies
    res.cookie("token", jwtToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 60 * 60 * 1000,
    });

    res.cookie("g_access_token", tokens.access_token, {
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
    console.error("Google Auth Code Exchange Failed:", error);
    res.status(401).json({ message: "Failed to authenticate with Google" });
  }
};


export const uploadToDrive = async (req, res) => {
  const { documentName = "Untitled Document", content = "" } = req.body;
  const accessToken = req.cookies.g_access_token;

  if (!accessToken) {
    return res.status(401).json({ message: "Missing Google Access Token" });
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.REDIRECT_URI
    );
    
    oauth2Client.setCredentials({ access_token: accessToken });

    const drive = google.drive({ version: "v3", auth: oauth2Client });

    const fileMetadata = {
      name: `${documentName}.txt`,
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
    const isUnauthorized = err?.response?.status === 401;
    if (isUnauthorized) {
      return res.status(401).json({ message: "Access token expired or invalid. Please login again." });
    }
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
};
