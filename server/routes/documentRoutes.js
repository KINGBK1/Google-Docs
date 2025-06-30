import express from "express";
import authMiddleware from "../middlewares/AuthMiddleware.js";
import {checkDocumentAccess}  from "../middlewares/checkDocumentAccess.js";
import {
  createDocument,
  getDocumentById,
  getMyDocuments,
  deleteMyDoc,
  toggleAccess,
  requestAccess,
  grantAccessViaLink,
  revokeAccess,
  addUserToDocument,
  updateDocument,
  getRestrictedStatus,
} from "../controllers/documentController.js";

const router = express.Router();

router.post("/", authMiddleware, createDocument);
router.get("/my-docs", authMiddleware, getMyDocuments);
router.get("/:id", authMiddleware, getDocumentById);
router.delete("/:id", authMiddleware, deleteMyDoc);
router.patch("/:id/access", authMiddleware, toggleAccess);
router.post("/:id/request-access", authMiddleware, requestAccess);
router.get("/:id/grant-access",authMiddleware, grantAccessViaLink);
router.patch("/:id/revoke", authMiddleware, revokeAccess);
router.post("/:id/share", authMiddleware, addUserToDocument);
router.patch("/:id", authMiddleware, updateDocument);
router.get("/:id/restricted-status", authMiddleware,getRestrictedStatus)

export default router;
