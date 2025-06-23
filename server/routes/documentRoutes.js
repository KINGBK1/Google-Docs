import express from "express";
import authMiddleware from "../middlewares/AuthMiddleware.js";
import {
  createDocument,
  getDocumentById,
  getMyDocuments,
  deleteMyDoc,
  toggleAccess,
  requestAccess,
  grantAccessViaLink,
  revokeAccess,
  addUserToDocument
} from "../controllers/documentController.js";

const router = express.Router();

router.post("/", authMiddleware, createDocument);
router.get("/my-docs", authMiddleware, getMyDocuments);
router.get("/:id", authMiddleware, getDocumentById);
router.delete("/:id", authMiddleware, deleteMyDoc);
router.patch("/:id/access", authMiddleware, toggleAccess);
router.post("/:id/request-access", authMiddleware, requestAccess);
router.get("/:id/grant-access", grantAccessViaLink);
router.patch("/:id/revoke", authMiddleware, revokeAccess);
router.post("/:id/share", authMiddleware, addUserToDocument);

export default router;
