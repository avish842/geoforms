import mongoose from "mongoose" ;

/* -------------------- Attachment Schema -------------------- */

const attachmentSchema = new mongoose.Schema({


  formId: { type: mongoose.Schema.Types.ObjectId, ref: 'Form' },
  responseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Response' },
  uploaderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fieldId: String, // 
  
  filename: String,
  url: String,
  cloudinaryPublicId: String,
  size: Number,
  contentType: String,
  createdAt: { type: Date, default: Date.now }


});


const Attachment =mongoose.model("Attachment", attachmentSchema);

export {Attachment};