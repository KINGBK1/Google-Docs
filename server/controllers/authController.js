import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import User from "../models/UserSchema.js";
import { google } from "googleapis";

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.REDIRECT_URI 
);

export const googleLogin = async (req, res) => {
  const { code } = req.body;

  try {
    // 1. Exchange code for tokens
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    const access_token = tokens.access_token;
    const id_token = tokens.id_token;

    // 2. Get user info using Google OAuth API
    const oauth2 = google.oauth2({ version: "v2", auth: client });
    const { data: userInfo } = await oauth2.userinfo.get();
    const { id: googleId, email, name, picture } = userInfo;

    // 3. Store or update user in DB
    let user = await User.findOne({ googleId });
    if (!user) {
      user = new User({ googleId, email, name, picture });
      await user.save();
    } else if (!user.picture) {
      user.picture = picture;
      await user.save();
    }

    // 4. Generate our own JWT
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

    // 5. Set cookies
    res.cookie("token", jwtToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 60 * 60 * 1000,
    });

    res.cookie("g_access_token", access_token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 60 * 60 * 1000,
    });

    // 6. Response
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
    res.status(401).json({ message: "Google authentication failed" });
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
