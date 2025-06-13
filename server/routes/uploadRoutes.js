// routes/upload-image.js
import express from "express";
import multer from "multer";
import cloudinaryModule from "cloudinary";
import streamifier from "streamifier";
import dotenv from 'dotenv'

const router = express.Router();

// config of dotenv
dotenv.config()

// Setup Multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Setup Cloudinary
const cloudinary = cloudinaryModule.v2;
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

router.post("/upload-image", upload.single("image"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const stream = cloudinary.uploader.upload_stream(
            {
                folder: "Docs_img_uploads",
                resource_type: "image",
            },
            (error, result) => {
                if (error) {
                    console.error("Cloudinary upload error:", error);
                    return res.status(500).json({ error: "Cloudinary upload failed" });
                } else {
                    return res.json({ url: result.secure_url });
                }
            }
        );

        streamifier.createReadStream(req.file.buffer).pipe(stream);
    } catch (err) {
        console.error("Unexpected error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
