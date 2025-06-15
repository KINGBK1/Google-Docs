import express from "express";
import authMiddleware from "../middlewares/AuthMiddleware.js";
import {
  createDocument,
  getDocumentById,
  getMyDocuments,
  deleteMyDoc
} from "../controllers/documentController.js";

import DocumentModel from "../models/DocumentSchema.js";
import User from "../models/UserSchema.js";              


const router = express.Router();

router.post("/", authMiddleware, createDocument);
router.get("/my-docs", authMiddleware, getMyDocuments);
router.get("/:id", authMiddleware, getDocumentById);
router.delete("/:id", authMiddleware, deleteMyDoc);

export default router;
