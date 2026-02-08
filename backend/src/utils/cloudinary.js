import { v2 as cloudinary } from "cloudinary";
import fs from 'fs'
import dotenv from 'dotenv'
dotenv.config()

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})



const uploadOnCloudinary =async(localFilePath)=>{
    console.log("Uploading file to Cloudinary:", localFilePath);
    try {
        if(!localFilePath) {
            throw new Error("No file path provided for upload");
            return null; // Return null if no file path is provided
        }
        // upload the file to cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"// it will automatically detect the type of file (image, video, etc.)
        })
        // file is uploaded successfully
        console.log("File uploaded successfully to Cloudinary",response.url);
        return response; // Return the entire response object to the user
    } catch (error) {
        console.error("Error uploading file to Cloudinary:", error);
        fs.unlinkSync(localFilePath)// Delete the local file if upload fails
        return null
    }
}


export {uploadOnCloudinary};
