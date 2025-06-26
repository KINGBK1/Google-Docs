import mongoose from "mongoose";

const documentSchema = new mongoose.Schema({
  _id: String,
  name: { type: String, required: true, default: 'Untitled Document' }, 
  content: { type: Object, default: {} }, 
  updatedAt: { type: Date, default: Date.now },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  isRestricted: { type: Boolean, default: false },
  allowedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  mode: {
  type: String,
  enum: ["editing", "viewing", "suggesting"],
  default: "editing",
},

});

const DocumentModel = mongoose.model("Document", documentSchema);
export default DocumentModel;