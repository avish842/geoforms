import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {ApiError} from "../utils/ApiError.js";
import { Attachment } from "../models/attachment.model.js";

import {Response} from "../models/response.model.js";
import mongoose from "mongoose";

import { Form } from "../models/form.model.js";


import { uploadOnCloudinary } from "../utils/cloudinary.js";

const createResponse= asyncHandler(async (req,res)=>{
    const session=await mongoose.startSession();
    
    try{


        session.startTransaction();
        const {formId}=req.params;
        const {answers,email,location,ip} =req.body;
        
        console.log("user", req.user);
        console.log("formId", formId);
        console.log("email", email);

        const userId=req.user?._id;
        console.log("userId", userId);


        if(!userId){
            throw new ApiError(404,"User not found");
        }



        if (!formId || !answers) {
            throw new ApiError(400,"formId and answers are required");
        }

        const form= await Form.findById(formId).session(session);

        if(!form){
            throw new ApiError(404,"Form not found");
        }
        if(form.isActive===false){
            throw new ApiError(403,"Form is not active");
        }

        // Submission limit validation
        if(form.settings.submissionLimitPerUser && form.settings.submissionLimitPerUser > 0){
            const existingResponsesCount = await Response.countDocuments({
                submitterId: userId,
                formId
            }).session(session);

            if(existingResponsesCount >= form.settings.submissionLimitPerUser){
                throw new ApiError(409,`Submission limit reached. You can only submit ${form.settings.submissionLimitPerUser} response(s) for this form`);
            }
        }

        if(form.settings.emailDomainWhitelist.length>0&&email){
            const userEmailDomain=email.split("@")[1];
            if(!form.settings.emailDomainWhitelist.includes(userEmailDomain)){
                throw new ApiError(403,`${userEmailDomain} domain is not whitelisted for this form`);
            }
        
        }

        // Geofence validation using MongoDB geospatial query
        if(form.settings.geofence && form.settings.geofence.coordinates && form.settings.geofence.coordinates.length > 0){
            if(!location || !location.lat || !location.lng){
                throw new ApiError(400,"Location is required for this geofenced form");
            }

            let isInsideGeofence;
            
            if(form.settings.geofence.type === "Polygon"){
                // For Polygon: check if point intersects with polygon
                isInsideGeofence = await Form.findOne({
                    _id: formId,
                    "settings.geofence": {
                        $geoIntersects: {
                            $geometry: {
                                type: "Point",
                                coordinates: [location.lng, location.lat]
                            }
                        }
                    }
                }).session(session);
            } else if(form.settings.geofence.type === "Point" && form.settings.geofence.radius){
                // For Point (Circle): check if user's location is within radius
                // Using Haversine formula since $centerSphere can't check external points
                const [centerLng, centerLat] = form.settings.geofence.coordinates;
                const R = 6378137; // Earth's radius in meters
                const dLat = (location.lat - centerLat) * Math.PI / 180;
                const dLng = (location.lng - centerLng) * Math.PI / 180;
                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                          Math.cos(centerLat * Math.PI / 180) * Math.cos(location.lat * Math.PI / 180) *
                          Math.sin(dLng / 2) * Math.sin(dLng / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                const distance = R * c; // distance in meters

                isInsideGeofence = distance <= form.settings.geofence.radius;
            }

            if(!isInsideGeofence){
                throw new ApiError(403,"Your location is outside the allowed geofence area for this form");
            }
        }

        // Time window validation
        if(form.settings.timeWindow){
            const now = new Date();
            const start = form.settings.timeWindow.start;
            const end = form.settings.timeWindow.end;

            if(start && new Date(start) > now){
                throw new ApiError(403,"Form submissions have not started yet");
            }

            if(end && new Date(end) < now){
                throw new ApiError(403,"Form submission deadline has passed");
            }
        }

        const [response] =  await Response.create([{
            formId,
            submitterId: userId,
            submitterEmail: email || null,
            answers,
            location: location || null,
            ip: ip || null,
        }],{session});

        if(!response){
            throw new ApiError(500,"Failed to submit response");
        }

        const attachments=answers.flatMap(answer=>{
            if(answer.value&&!Array.isArray(answer.value)&& typeof answer.value==="object"&&answer.value.url){

                    return [{
                uploaderId: userId,
                responseId: response._id,
                formId,
                filename: answer.value.filename,
                url: answer.value.url,
                cloudinaryPublicId: answer.value.cloudinaryPublicId,
                size: answer.value.size,
                contentType: answer.value.mimeType
                }]
            }
            if(Array.isArray(answer.value)){

                return answer.value.filter(file=>file&&file.url)
                .map(file=>({
                    uploaderId:userId,
                    responseId:response._id,    
                    formId,
                    filename:file.filename,
                    url:file.url,
                    cloudinaryPublicId:file.cloudinaryPublicId,
                    size:file.size,
                    contentType:file.mimeType
                }))
            }

            return [];
        });

        if(attachments.length>0){
            await Attachment.insertMany(attachments,{session});
        }

        
        await session.commitTransaction();

        return res.status(200).json(
            new ApiResponse(200,"Response submitted successfully",{
                formId,
                userId,
                answers,
                email,
                location,
                ip
            })
        );  
        }catch(error){
            await session.abortTransaction();

            throw error; 
        }
        finally{
            session.endSession();
        }

    


});

const uploadAttachment=asyncHandler(async(req,res)=>{
    const file=req.files?.file[0]?.path;

    console.log(file)

    if(!file){
        throw new ApiError(400,"No file uploaded");
    }

    const fileUrl=await uploadOnCloudinary(file);

    if(!fileUrl){
        throw new ApiError(500,"Failed to upload file");
    }
    res.status(200).json(
        new ApiResponse(200,"File uploaded successfully",{
            url:fileUrl.url,
            cloudinaryPublicId:fileUrl.public_id,
            filename:req.files.file[0].originalname,
            size:req.files.file[0].size,    
            mimeType:req.files.file[0].mimetype
        })
    );  
});

const getResponses = asyncHandler(async (req, res) => {
    const { formId } = req.params;
    const userId = req.user._id;

    // Verify the logged-in user owns this form
    const form = await Form.findOne({ _id: formId, ownerId: userId });
    if (!form) {
        throw new ApiError(404, "Form not found or you don't have permission");
    }

    const responses = await Response.find({ formId })
        .sort({ createdAt: -1 })
        .populate("attachments")
        .lean();

    return res.status(200).json(
        new ApiResponse(200, responses, "Responses fetched successfully")
    );
});

export {createResponse, uploadAttachment, getResponses}