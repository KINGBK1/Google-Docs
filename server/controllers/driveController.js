import { google } from "googleapis";

export const uploadToDrive = async (req, res) => {
  const { documentName = "Untitled Document", content = "", folderId = null } = req.body;
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
      ...(folderId && { parents: [folderId] }) 
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
