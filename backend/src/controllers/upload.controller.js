import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { Attachment } from "../models/attachment.model.js";

import {ApiError} from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const uploadFile = async (req, res) => {
    try {
        const file = req.file?.path;
        if (!file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const { fieldId, formId, oldAttachmentId } = req.body;

        // ── If replacing an existing file, clean up the old one ──
        if (oldAttachmentId) {
            const oldAttachment = await Attachment.findById(oldAttachmentId);
            if (oldAttachment) {
                await deleteFromCloudinary(oldAttachment.cloudinaryPublicId);
                await Attachment.findByIdAndDelete(oldAttachmentId);
            }
        }

        // ── Upload new file to Cloudinary ──
        const fileUrl = await uploadOnCloudinary(file);
        if (!fileUrl) {
            return res.status(500).json({ message: "Failed to upload file" });
        }

        // ── Save new attachment document ──
        const attachment = await Attachment.create({
            formId: formId || null,
            fieldId: fieldId || null,
            filename: req.file.originalname,
            url: fileUrl.url,
            cloudinaryPublicId: fileUrl.public_id,
            size: req.file.size,
            contentType: req.file.mimetype,
        });

        return res.status(200).json({
            message: "File uploaded successfully",
            file: fileUrl,
            attachment,
        });
    } catch (error) {
        console.error("Upload error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

const deleteFile = async (req, res) => {
    const { attachmentId } = req.params;
    try {
        if (!attachmentId) {
            throw new ApiError(400, "Attachment ID is required");
        }

        const attachment = await Attachment.findById(attachmentId);
        if (!attachment) {
            throw new ApiError(404, "Attachment not found");
        }

        // Delete from Cloudinary
        await deleteFromCloudinary(attachment.cloudinaryPublicId);

        // Delete from database
        await Attachment.findByIdAndDelete(attachmentId);

        return res.status(200).json(
            new ApiResponse(200, null, "File deleted successfully")
        );
    } catch (error) {
        console.error("Error deleting file:", error);
        const status = error.statusCode || 500;
        return res.status(status).json({ message: error.message || "Failed to delete file" });
    }
};   

export  { uploadFile, deleteFile } ;