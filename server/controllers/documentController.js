import DocumentModel from "../models/DocumentSchema.js";

export const createDocument = async (req, res) => {
  const { documentId, name } = req.body;
  if (!documentId || !name) return res.status(400).json({ message: "documentId and name are required" });

  try {
    const newDoc = await DocumentModel.create({
      _id: documentId,
      name: name,
      content: {},
      owner: req.user.id,
    });
    res.status(201).json(newDoc); 
  } catch (err) {
    console.error("Document creation failed:", err);
    res.status(500).json({ message: "Server error creating document" });
  }
};

export const getDocumentById = async (req, res) => {
  try {
    const doc = await DocumentModel.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.status(200).json(doc);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getMyDocuments = async (req, res) => {
  try {
    // 1. Find the logged-in user using the ID from the token
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // 2. Get the array of document IDs from the user object
    const documentIds = user.documents;

    // Handle case where the user has no documents
    if (!documentIds || documentIds.length === 0) {
      return res.status(200).json([]);
    }

    // 3. Find all documents whose '_id' is in the user's documentIds array
    const docs = await DocumentModel.find({
      '_id': { $in: documentIds }
    }).sort({ updatedAt: -1 }); // Sort by most recently updated

    res.status(200).json(docs);

  } catch (err) {
    console.error("Failed to get docs:", err);
    res.status(500).json({ message: "Server error fetching documents" });
  }
};
