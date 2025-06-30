import DocumentModel from "../models/DocumentSchema.js";
import User from "../models/UserSchema.js";
import transporter from "../utils/mailer.js";
import sanitize from "sanitize-html";
import validator from "validator";
import mongoose from "mongoose";
import { RateLimiterMemory } from "rate-limiter-flexible";

const rateLimiter = new RateLimiterMemory({
  points: 10,
  duration: 60,
});

const sanitizeInput = (input) => {
  return typeof input === "string" ? sanitize(input, {
    allowedTags: [],
    allowedAttributes: {},
  }) : input;
};

const validateObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

export const createDocument = async (req, res) => {
  try {
    await rateLimiter.consume(req.ip);

    const { documentId, name, isRestricted = false, allowedUsers = [] } = req.body;

    if (!req.user?.id || !validateObjectId(req.user.id)) {
      return res.status(401).json({ message: "Invalid user authentication" });
    }

    if (!documentId || !name || name.length > 100) {
      return res.status(400).json({ message: "Invalid document ID or name" });
    }

    if (allowedUsers.length > 100) {
      return res.status(400).json({ message: "Too many allowed users" });
    }

    const sanitizedName = sanitizeInput(name);
    const validatedUsers = allowedUsers.filter(id => validateObjectId(id));

    const existingDoc = await DocumentModel.findById(documentId);
    if (existingDoc) {
      return res.status(409).json({ message: "Document ID already exists" });
    }

    const newDoc = await DocumentModel.create({
      _id: documentId,
      name: sanitizedName,
      content: {},
      owner: req.user.id,
      isRestricted,
      allowedUsers: isRestricted ? [req.user.id, ...validatedUsers] : [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { documents: documentId }
    });

    res.status(201).json(newDoc);
  } catch (err) {
    console.error("Document creation failed:", err);
    res.status(500).json({ message: "Server error creating document" });
  }
};

export const getDocumentById = async (req, res) => {
  try {
    await rateLimiter.consume(req.ip);

    const { id } = req.params;
    if (!validateObjectId(id)) {
      return res.status(400).json({ message: "Invalid document ID" });
    }

    if (!req.user?.id || !validateObjectId(req.user.id)) {
      return res.status(401).json({ message: "Invalid user authentication" });
    }

    const doc = await DocumentModel.findById(id).populate({
      path: "allowedUsers",
      select: "name email"
    });

    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }

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
    await rateLimiter.consume(req.ip);

    if (!req.user?.id || !validateObjectId(req.user.id)) {
      return res.status(401).json({ message: "Invalid user authentication" });
    }

    const user = await User.findById(req.user.id).select("documents");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const documentIds = user.documents || [];
    if (!Array.isArray(documentIds)) {
      return res.status(400).json({ message: "Invalid document list" });
    }

    const docs = await DocumentModel.find({
      _id: { $in: documentIds }
    }).sort({ updatedAt: -1 });


    res.status(200).json(docs);
  } catch (err) {
    console.error("Failed to get docs:", err);
    res.status(500).json({ message: "Server error fetching documents" });
  }
};

export const deleteMyDoc = async (req, res) => {
  try {
    await rateLimiter.consume(req.ip);

    const { id } = req.params;
    if (!validateObjectId(id)) {
      return res.status(400).json({ message: "Invalid document ID" });
    }

    if (!req.user?.id || !validateObjectId(req.user.id)) {
      return res.status(401).json({ message: "Invalid user authentication" });
    }

    const doc = await DocumentModel.findById(id);
    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }

    if (!doc.owner.equals(req.user.id)) {
      return res.status(403).json({ message: "Only owner can delete document" });
    }

    await DocumentModel.findByIdAndDelete(id);
    await User.updateMany(
      { documents: id },
      { $pull: { documents: id } }
    );

    res.status(200).json({ message: "Document deleted successfully" });
  } catch (err) {
    console.error("Error deleting document:", err);
    res.status(500).json({ message: "Server error deleting document" });
  }
};

export const toggleAccess = async (req, res) => {
  try {
    await rateLimiter.consume(req.ip);

    const { id } = req.params;
    const { isRestricted } = req.body;

    if (!validateObjectId(id)) {
      return res.status(400).json({ message: "Invalid document ID" });
    }

    if (!req.user?.id || !validateObjectId(req.user.id)) {
      return res.status(401).json({ message: "Invalid user authentication" });
    }

    if (typeof isRestricted !== "boolean") {
      return res.status(400).json({ message: "Invalid access mode" });
    }

    const doc = await DocumentModel.findById(id);
    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }

    if (!doc.owner.equals(req.user.id)) {
      return res.status(403).json({ message: "Only owner can change access" });
    }

    doc.isRestricted = isRestricted;
    await doc.save();

    res.status(200).json({ message: "Access mode updated" });
  } catch (err) {
    console.error("Error toggling access:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const requestAccess = async (req, res) => {
  try {
    await rateLimiter.consume(req.ip);

    const { id: documentId } = req.params;
    if (!validateObjectId(documentId)) {
      return res.status(400).json({ message: "Invalid document ID" });
    }

    if (!req.user?.id || !validateObjectId(req.user.id)) {
      return res.status(401).json({ message: "Unauthorized: Invalid user" });
    }

    const requester = await User.findById(req.user.id);
    if (!requester) {
      return res.status(404).json({ message: "User not found" });
    }

    const document = await DocumentModel.findById(documentId).populate("owner");
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    if (document.owner.equals(req.user.id)) {
      return res.status(400).json({ message: "Owner cannot request access" });
    }

    if (document.allowedUsers.includes(req.user.id)) {
      return res.status(400).json({ message: "User already has access" });
    }

    const owner = await User.findById(document.owner);
    if (!owner) {
      return res.status(404).json({ message: "Document owner not found" });
    }

    const sanitizedName = sanitizeInput(requester.name);
    const accessLink = `${process.env.BACKEND_URL}/api/documents/${documentId}/grant-access?email=${encodeURIComponent(requester.email)}`;

    const mailOptions = {
      from: `"${sanitizedName}" (via BK-Google-Docs-Share) <${process.env.EMAIL_USER}>`,
      to: owner.email,
      subject: `${sanitizedName} is requesting access to your document`,
      html: `<div style="font-family: Arial, sans-serif; background-color: #f1f3f4; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          <div style="display: flex; align-items: center; margin-bottom: 20px;">
            <img src="https://ssl.gstatic.com/docs/doclist/images/mediatype/icon_1_document_x32.png" alt="Doc Icon" style="width: 32px; height: 32px; margin-right: 10px;" />
            <h2 style="margin: 0; font-size: 20px; color: #202124;">BK-Google-Docs Share Access Request</h2>
          </div>
          <p style="font-size: 16px; color: #333;">
            <strong>${sanitizedName}</strong> (<a href="mailto:${sanitizeInput(requester.email)}" style="color: #1a73e8;">${sanitizeInput(requester.email)}</a>) is requesting access to your document 
            <strong style="color: #1a73e8;">${sanitizeInput(document.name)}</strong>.
          </p>
          <p style="font-size: 15px; color: #5f6368;">
            To grant access, click the button below:
          </p>
          <a href="${accessLink}" target="_blank" 
             style="display:inline-block;margin-top:20px;margin-bottom:20px;padding:12px 24px;background-color:#1a73e8;color:white;text-decoration:none;font-weight:bold;border-radius:6px;font-size:16px;">
            Grant Access
          </a>
          <p style="font-size: 13px; color: #5f6368; margin-top: 30px;">
            If you don't recognize this request, you can safely ignore this email.
          </p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;" />
          <p style="font-size: 12px; color: #999; text-align: center;">
            Sent via BK-Google-Docs Share • <a href="${sanitizeInput(process.env.FRONTEND_URL)}" style="color: #999; text-decoration: none;">Open Dashboard</a>
          </p>
        </div>
      </div>`,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Access request sent to document owner" });
  } catch (error) {
    console.error("Error in requestAccess:", error);
    res.status(500).json({ message: "Server error requesting access" });
  }
};

export const grantAccessViaLink = async (req, res) => {
  try {
    await rateLimiter.consume(req.ip);

    const { id: docId } = req.params;
    const { email } = req.query;

    if (!validateObjectId(docId)) {
      return res.status(400).json({ message: "Invalid document ID" });
    }

    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const document = await DocumentModel.findById(docId).populate("owner");
    const userToGrant = await User.findOne({ email: sanitizeInput(email) });

    if (!document || !userToGrant) {
      return res.status(404).send("Document or user not found");
    }

    if (!document.owner.equals(req.user.id)) {
      return res.status(403).json({ message: "Only owner can grant access" });
    }

    if (!document.allowedUsers.includes(userToGrant._id)) {
      document.allowedUsers.push(userToGrant._id);
      await document.save();
    }

    if (!userToGrant.documents.includes(docId)) {
      userToGrant.documents.push(docId);
      await userToGrant.save();
    }

    const mailOptions = {
      from: `"BK-Google-Docs" <${process.env.EMAIL_USER}>`,
      to: userToGrant.email,
      subject: `You've been granted access to "${sanitizeInput(document.name)}"`,
      html: `
        <div style="font-family: Arial; padding: 20px;">
          <h2 style="color: #1a73e8;">Access Granted</h2>
          <p>Hello ${sanitizeInput(userToGrant.name || userToGrant.email)},</p>
          <p>You have been granted access to the document: <strong>${sanitizeInput(document.name)}</strong></p>
          <a href="${sanitizeInput(process.env.FRONTEND_URL)}/documents/${docId}" 
             style="background: #1a73e8; color: white; padding: 10px 16px; 
             text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">
             Open Document
          </a>
          <p style="margin-top: 30px; font-size: 12px; color: #888;">If this wasn’t you, ignore this message.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return res.sendFile("access-granted.html", { root: "public" });
  } catch (err) {
    console.error("Grant access error:", err);
    res.status(500).send("Something went wrong.");
  }
};

export const revokeAccess = async (req, res) => {
  try {
    await rateLimiter.consume(req.ip);

    const { id: docId } = req.params;
    const { userId } = req.body;

    if (!validateObjectId(docId) || !validateObjectId(userId)) {
      return res.status(400).json({ message: "Invalid document or user ID" });
    }

    if (!req.user?.id || !validateObjectId(req.user.id)) {
      return res.status(401).json({ message: "Invalid user authentication" });
    }

    const document = await DocumentModel.findById(docId);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    if (!document.owner.equals(req.user.id)) {
      return res.status(403).json({ message: "Only owner can revoke access" });
    }

    if (document.owner.equals(userId)) {
      return res.status(400).json({ message: "Cannot revoke owner access" });
    }

    document.allowedUsers = document.allowedUsers.filter(uid => uid.toString() !== userId);
    await document.save();

    const user = await User.findById(userId);
    if (user) {
      user.documents = user.documents.filter(doc => doc.toString() !== docId);
      await user.save();
    }

    res.status(200).json({ message: "Access revoked successfully" });
  } catch (err) {
    console.error("Error revoking access:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const addUserToDocument = async (req, res) => {
  try {
    await rateLimiter.consume(req.ip);

    const { id: documentId } = req.params;
    const { email } = req.body;

    if (!validateObjectId(documentId)) {
      return res.status(400).json({ message: "Invalid document ID" });
    }

    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (!req.user?.id || !validateObjectId(req.user.id)) {
      return res.status(401).json({ message: "Invalid user authentication" });
    }

    const userToAdd = await User.findOne({ email: sanitizeInput(email) });
    if (!userToAdd) {
      return res.status(404).json({ message: "User not found" });
    }

    const document = await DocumentModel.findById(documentId).populate("owner");
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    if (!document.owner.equals(req.user.id)) {
      return res.status(403).json({ message: "Only owner can add users" });
    }

    if (document.allowedUsers.includes(userToAdd._id)) {
      return res.status(400).json({ message: "User already has access" });
    }

    document.allowedUsers.push(userToAdd._id);
    await document.save();

    if (!userToAdd.documents.includes(documentId)) {
      userToAdd.documents.push(documentId);
      await userToAdd.save();
    }

    const mailOptions = {
      from: `"BK-Google-Docs" <${process.env.EMAIL_USER}>`,
      to: userToAdd.email,
      subject: `You've been granted access to "${sanitizeInput(document.name)}"`,
      html: `
        <div style="font-family: Arial; padding: 20px;">
          <h2 style="color: #1a73e8;">Access Granted</h2>
          <p>Hello ${sanitizeInput(userToAdd.name || userToAdd.email)},</p>
          <p>You have been granted access to the document: <strong>${sanitizeInput(document.name)}</strong></p>
          <a href="${sanitizeInput(process.env.FRONTEND_URL)}/documents/${documentId}" 
             style="background: #1a73e8; color: white; padding: 10px 16px; 
             text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">
             Open Document
          </a>
          <p style="margin-top: 30px; font-size: 12px; color: #888;">If this wasn’t you, ignore this message.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "User added and notified successfully" });
  } catch (err) {
    console.error("Error sharing document:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateDocument = async (req, res) => {
  try {
    await rateLimiter.consume(req.ip);

    const { id } = req.params;
    const updates = req.body;

    if (!validateObjectId(id)) {
      return res.status(400).json({ message: "Invalid document ID" });
    }

    if (!req.user?.id || !validateObjectId(req.user.id)) {
      return res.status(401).json({ message: "Invalid user authentication" });
    }

    const document = await DocumentModel.findById(id);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    if (!document.owner.equals(req.user.id)) {
      return res.status(403).json({ message: "Only owner can update the document" });
    }

    const allowedFields = ['name', 'content', 'isRestricted'];
    const sanitizedUpdates = {};
    Object.entries(updates).forEach(([key, value]) => {
      if (allowedFields.includes(key)) {
        sanitizedUpdates[key] = key === 'name' ? sanitizeInput(value) : value;
      }
    });

    if (sanitizedUpdates.name && sanitizedUpdates.name.length > 100) {
      return res.status(400).json({ message: "Document name too long" });
    }

    Object.assign(document, sanitizedUpdates, { updatedAt: new Date() });
    await document.save();

    res.status(200).json({ message: "Document updated successfully", document });
  } catch (err) {
    console.error("Error updating document:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getRestrictedStatus = async (req, res) => {
  try {
    await rateLimiter.consume(req.ip);

    const { id } = req.params;
    if (!validateObjectId(id)) {
      return res.status(400).json({ isEligible: false, message: "Invalid document ID" });
    }

    if (!req.user?.id || !validateObjectId(req.user.id)) {
      return res.status(401).json({ isEligible: false, message: "Unauthorized" });
    }

    const doc = await DocumentModel.findById(id);
    if (!doc) {
      return res.status(404).json({ isEligible: false, message: "Document not found" });
    }

    const isOwner = doc.owner.equals(req.user.id);
    const isAllowed = doc.allowedUsers.includes(req.user.id);

    const isEligible = doc.isRestricted && !isOwner && !isAllowed;

    return res.status(200).json({ isEligible });
  } catch (err) {
    console.error("Error checking restricted status:", err);
    return res.status(500).json({ isEligible: false, message: "Server error" });
  }
};