import mongoose from "mongoose";
import {Attachment} from "./attachment.model.js";

/* -------------------- Answer Schema -------------------- */
const answerSchema = new mongoose.Schema(
  {
    fieldId: {
      type: String,
      required: true,
    },

    value: {
      type: mongoose.Schema.Types.Mixed, // string, number, array, or object
    },

    fileRefs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Attachment" }]// for file uploads
  },
  { _id: false }
);

/* -------------------- Response Schema -------------------- */
const responseSchema = new mongoose.Schema(
  {
    formId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Form",
      required: true,
      index: true,
    },

    submitterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
      required: true,
    },

    submitterEmail: {
      type: String,
      default: null,
    },

    answers: [answerSchema],

    location: {
      lat: Number,
      lng: Number,
    },

    ip: {
      type: String,
    },

    attachments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Attachment",
      },
    ],

    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

const Response = mongoose.model("Response", responseSchema);

export { Response };
