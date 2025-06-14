import express from "express";
import authMiddleware from "../middlewares/AuthMiddleware.js";
import {
  createDocument,
  getDocumentById,
  getMyDocuments,
} from "../controllers/documentController.js";

const router = express.Router();

router.post("/", authMiddleware, createDocument);
router.get("/my-docs", authMiddleware, getMyDocuments);
router.get("/:id", authMiddleware, getDocumentById);

export default router;
