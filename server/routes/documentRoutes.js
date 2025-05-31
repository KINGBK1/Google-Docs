import express from "express";
import authMiddleware from "../middlewares/AuthMiddleware.js";
import {
  createDocument,
  getDocumentById,
  getMyDocuments,
} from "../controllers/documentController.js";

const router = express.Router();

router.post("/", authMiddleware, createDocument);
router.get("/:id", authMiddleware, getDocumentById);
router.get("/my-docs", authMiddleware, getMyDocuments);

export default router;
