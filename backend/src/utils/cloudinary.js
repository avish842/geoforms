import { v2 as cloudinary } from "cloudinary";
import fs from 'fs'

let configured = false;
const ensureConfig = () => {
    if (configured) return;
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    configured = true;
};

const uploadOnCloudinary = async (localFilePath) => {
    ensureConfig();
    console.log("Uploading file to Cloudinary:", localFilePath);
    try {
        if (!localFilePath) {
            throw new Error("No file path provided for upload");
        }
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });
        console.log("File uploaded successfully to Cloudinary", response.url);
        // Remove temp file after successful upload
        try { fs.unlinkSync(localFilePath); } catch {}
        return response;
    } catch (error) {
        console.error("Error uploading file to Cloudinary:", error);
        // Safely attempt to remove temp file on failure
        try { fs.unlinkSync(localFilePath); } catch {}
        return null;
    }
};

const deleteFromCloudinary = async (publicId) => {
    ensureConfig();
    try {
        if (!publicId) return null;
        const result = await cloudinary.uploader.destroy(publicId);
        console.log("Deleted from Cloudinary:", publicId, result);
        return result;
    } catch (error) {
        console.error("Error deleting from Cloudinary:", error);
        return null;
    }
};

export { uploadOnCloudinary, deleteFromCloudinary };
