import DocumentModel from "../models/DocumentSchema.js";
import User from "../models/UserSchema.js";
import transporter from "../utils/mailer.js";

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
    if (!user) return res.status(404).json({ message: "User not found." });

    const documentIds = user.documents || [];
    const docs = await DocumentModel.find({ _id: { $in: documentIds } }).sort({ updatedAt: -1 });
    res.status(200).json(docs);
  } catch (err) {
    console.error("Failed to get docs:", err);
    res.status(500).json({ message: "Server error fetching documents" });
  }
};

export const deleteMyDoc = async (req, res) => {
  try {
    const id = req.params.id;
    const deletedDoc = await DocumentModel.findByIdAndDelete(id);
    if (!deletedDoc) return res.status(404).json({ message: "Document not found" });

    await User.findByIdAndUpdate(req.user.id, {
      $pull: { documents: id }
    });

    res.status(200).json({ message: "Document deleted successfully" });
  } catch (err) {
    console.error("Error deleting document:", err);
    res.status(500).json({ message: "Server error deleting document" });
  }
};

export const toggleAccess = async (req, res) => {
  const { id } = req.params;
  const { isRestricted } = req.body;

  const doc = await DocumentModel.findById(id);
  if (!doc) return res.status(404).json({ message: "Doc not found" });
  if (!doc.owner.equals(req.user.id)) return res.status(403).json({ message: "Only owner can change access" });

  doc.isRestricted = isRestricted;
  await doc.save();

  res.status(200).json({ message: "Access mode updated" });
};

export const requestAccess = async (req, res) => {
  const { id: documentId } = req.params;

  try {
    if (!req.user?.id) return res.status(401).json({ message: "Unauthorized: User not found" });

    const requester = await User.findById(req.user.id);
    const document = await DocumentModel.findById(documentId).populate("owner");
    if (!document) return res.status(404).json({ message: "Document not found" });

    const owner = await User.findById(document.owner);
    const accessLink = `${process.env.BACKEND_URL}/api/documents/${documentId}/grant-access?email=${requester.email}`;

    const mailOptions = {
      from: `${requester.name} (via BK-Google-Docs-Share) <${process.env.EMAIL_USER}>`,
      to: owner.email,
      subject: `${requester.name} is requesting access to your document`,
      html: `<div style="font-family: Arial, sans-serif; background-color: #f1f3f4; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
      
      <div style="display: flex; align-items: center; margin-bottom: 20px;">
        <img src="https://ssl.gstatic.com/docs/doclist/images/mediatype/icon_1_document_x32.png" alt="Doc Icon" style="width: 32px; height: 32px; margin-right: 10px;" />
        <h2 style="margin: 0; font-size: 20px; color: #202124;">BK-Google-Docs Share Access Request</h2>
      </div>
      
      <p style="font-size: 16px; color: #333;">
        <strong>${requester.name}</strong> (<a href="mailto:${requester.email}" style="color: #1a73e8;">${requester.email}</a>) is requesting access to your document 
        <strong style="color: #1a73e8;">"${document.name}"</strong>.
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
        Sent via BK-Google-Docs Share • <a href="${process.env.FRONTEND_URL}" style="color: #999; text-decoration: none;">Open Dashboard</a>
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
  const docId = req.params.id;
  const email = req.query.email;

  try {
    const document = await DocumentModel.findById(docId).populate("owner");
    const userToGrant = await User.findOne({ email });

    if (!document || !userToGrant) return res.status(404).send("Document or user not found");

    // Grant document access if not already
    if (!document.allowedUsers.includes(userToGrant._id)) {
      document.allowedUsers.push(userToGrant._id);
      await document.save();
    }

    if (!userToGrant.documents.includes(docId)) {
      userToGrant.documents.push(docId);
      await userToGrant.save();
    }

    // Send Access Granted Mail
    const mailOptions = {
      from: `"BK-Google-Docs" <${process.env.EMAIL_USER}>`,
      to: userToGrant.email,
      subject: `You've been granted access to "${document.name}"`,
      html: `
        <div style="font-family: Arial; padding: 20px;">
          <h2 style="color: #1a73e8;">Access Granted</h2>
          <p>Hello ${userToGrant.name || userToGrant.email},</p>
          <p>You have been granted access to the document: <strong>${document.name}</strong></p>
          <a href="${process.env.FRONTEND_URL}/documents/${document._id}" 
             style="background: #1a73e8; color: white; padding: 10px 16px; 
             text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">
             Open Document
          </a>
          <p style="margin-top: 30px; font-size: 12px; color: #888;">If this wasn’t you, ignore this message.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    // console.log("Access mail sent to:", userToGrant.email);

    return res.sendFile("access-granted.html", { root: "public" });
  } catch (err) {
    console.error("Grant access error:", err);
    res.status(500).send("Something went wrong.");
  }
};


export const revokeAccess = async (req, res) => {
  const { id: docId } = req.params;
  const { userId } = req.body;

  try {
    const document = await DocumentModel.findById(docId);
    if (!document) return res.status(404).json({ message: "Document not found" });

    if (!document.owner.equals(req.user.id)) {
      return res.status(403).json({ message: "Only owner can revoke access" });
    }

    document.allowedUsers = document.allowedUsers.filter(uid => uid.toString() !== userId);
    await document.save();

    const user = await User.findById(userId);
    user.documents = user.documents.filter(doc => doc.toString() !== docId);
    await user.save();

    res.status(200).json({ message: "Access revoked successfully" });
  } catch (err) {
    console.error("Error revoking access:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const addUserToDocument = async (req, res) => {
  const {id: documentId}  = req.params;
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const userToAdd = await User.findOne({ email });
    if (!userToAdd) {
      return res.status(404).json({ message: "User not found" });
    }

    const document = await DocumentModel.findById(documentId).populate("owner");
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    const alreadyAdded = document.allowedUsers.includes(userToAdd._id);
    if (alreadyAdded) {
      return res.status(400).json({ message: "User already has access" });
    }

    // Add user to allowedUsers
    document.allowedUsers.push(userToAdd._id);
    await document.save();

    // Add document to user’s list
    if (!userToAdd.documents.includes(documentId)) {
      userToAdd.documents.push(documentId);
      await userToAdd.save();
    }

    // Send email notification
    const mailOptions = {
      from: `"BK-Google-Docs" <${process.env.EMAIL_USER}>`,
      to: userToAdd.email,
      subject: `You've been granted access to "${document.name}"`,
      html: `
        <div style="font-family: Arial; padding: 20px;">
          <h2 style="color: #1a73e8;">Access Granted</h2>
          <p>Hello ${userToAdd.name || userToAdd.email},</p>
          <p>You have been granted access to the document: <strong>${document.name}</strong></p>
          <a href="${process.env.FRONTEND_URL}/documents/${document._id}" 
             style="background: #1a73e8; color: white; padding: 10px 16px; 
             text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">
             Open Document
          </a>
          <p style="margin-top: 30px; font-size: 12px; color: #888;">If this wasn’t you, ignore this message.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("Access email sent to:", userToAdd.email);

    res.status(200).json({ message: "User added and notified successfully" });
  } catch (err) {
    console.error("Error sharing document:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateDocument = async (req,res) =>{
  const {id} = req.params ; 
  const updates = req.body ;
  try{ 
    const document = await DocumentModel.findById(id) ; 

    if(!document) return res.status(404).json({message:"document not found"}) ;

    // only owners can change the mode of the documebnt 
    if(!document.owner.equals(req.user.id)){
      return res.status(403).json({message:"only owner can update the document"}) ; 
    }

        // Apply updates
    Object.entries(updates).forEach(([key, value]) => {
      document[key] = value;
    });

    await document.save();
    res.status(200).json({ message: "Document updated successfully", document });
   } catch (err){
     console.error("Error updating document:", err);
     res.status(500).json({ message: "Server error" });
  }
}