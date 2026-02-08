import mongoose from "mongoose" ;

/* -------------------- Attachment Schema -------------------- */

const attachmentSchema = new mongoose.Schema({


  uploaderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  responseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Response' },
  
  
  formId: { type: mongoose.Schema.Types.ObjectId, ref: 'Form' },
  
  filename: String,
  url: String,
  cloudinaryPublicId: String,
  size: Number,
  contentType: String,
  createdAt: { type: Date, default: Date.now }


});


const Attachment =mongoose.model("Attachment", attachmentSchema);

export {Attachment};