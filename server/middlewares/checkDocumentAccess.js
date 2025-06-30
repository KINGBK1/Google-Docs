import DocumentModel from "../models/DocumentSchema.js";

export const checkDocumentAccess = async (req, res, next) => {
  const { id } = req.params;
  try {
    const doc = await DocumentModel.findById(id);
    if (!doc) return res.status(404).json({ message: "Document not found" });

    const isOwner = doc.owner.equals(req.user.id);
    const isAllowed = doc.allowedUsers.includes(req.user.id);

    if (doc.isRestricted && !isOwner && !isAllowed) {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};
