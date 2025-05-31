import mongoose from "mongoose";

const documentSchema = new mongoose.Schema({
  _id: String,
  name: { type: String, required: true, default: 'Untitled Document' }, 
  content: { type: Object, default: {} }, 
  updatedAt: { type: Date, default: Date.now },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});
const DocumentModel = mongoose.model("Document", documentSchema);


export default DocumentModel ; 