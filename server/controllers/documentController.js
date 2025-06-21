import DocumentModel from "../models/DocumentSchema.js";
import User from "../models/UserSchema.js";

export const createDocument = async (req, res) => {
  const { documentId, name, isRestricted = false, allowedUsers = [] } = req.body;

  try {
    const newDoc = await DocumentModel.create({
      _id: documentId,
      name,
      content: {},
      owner: req.user.id,
      isRestricted,
      allowedUsers: isRestricted ? [req.user.id, ...allowedUsers] : [],
    });
    res.status(201).json(newDoc);
  } catch (err) {
    console.error("Document creation failed:", err);
    res.status(500).json({ message: "Server error creating document" });
  }
};


export const getDocumentById = async (req, res) => {
  try {
    const doc = await DocumentModel.findById(req.params.id).populate("allowedUsers");
    if (!doc) return res.status(404).json({ message: "Document not found" });

    const isOwner = doc.owner && doc.owner.equals(req.user.id);
    const isAllowed = doc.allowedUsers.some(user => user._id.equals(req.user.id));

    if (doc.isRestricted && !isOwner && !isAllowed) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.status(200).json(doc);
  } catch (err) {
    console.error("Error getting document by ID:", err);
    res.status(500).json({ message: "Server error" });
  }
};


export const getMyDocuments = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const documentIds = user.documents || [];
    if (documentIds.length === 0) {
      // console.log("getMyDocuments: no docs for user", req.user.id);
      return res.status(200).json([]);
    }

    const docs = await DocumentModel.find({ _id: { $in: documentIds } })
      .sort({ updatedAt: -1 });

    // console.log(`getMyDocuments: returning ${docs.length} docs`);
    res.status(200).json(docs);
  } catch (err) {
    console.error("Failed to get docs:", err);
    res.status(500).json({ message: "Server error fetching documents" });
  }
};

export const deleteMyDoc = async (req, res) => {
  try {
    const { id } = req.params;

    // Remove document from Document collection
    const deletedDoc = await DocumentModel.findByIdAndDelete(id);
    if (!deletedDoc) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Also remove document reference from user's document list
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { documents: id }
    });

    res.status(200).json({ message: "Document deleted successfully" });
  } catch (err) {
    console.error("Error deleting document:", err);
    res.status(500).json({ message: "Server error deleting document" });
  }
}

export const toggleAccess = async (req, res) => {
  const { id } = req.params;
  const { isRestricted } = req.body;

  const doc = await DocumentModel.findById(id);
  if (!doc) return res.status(404).json({ message: "Doc not found" });

  if (!doc.owner.equals(req.user.id)) {
    return res.status(403).json({ message: "Only owner can change access" });
  }

  doc.isRestricted = isRestricted;
  await doc.save();

  res.status(200).json({ message: "Access mode updated" });
};

