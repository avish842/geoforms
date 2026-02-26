
import {Form} from "../models/form.model.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";

const createForm=asyncHandler(async(req,res)=>{
    const {
        title,
        description,
        fields=[],
        settings={}    }=req.body;

    const ownerId=req.user._id;
    console.log("Owner ID from token:", ownerId);

    if(!ownerId){
        throw new ApiError(400,"Owner ID is required to create form");
    }

    const form = await Form.create({
        ownerId,
        title,
        description,
        fields,
        settings           
    })

    console.log("forms data:",form)
    if(!form){
        throw new ApiError(500,"Failed to create form");
    }
    res.status(200).json(
        new ApiResponse(201,form,"Form created successfully")
    );

});


const getForm=asyncHandler(async(req,res)=>{
    const {formId}=req.params;

    const form=await Form.findOne({
        _id:formId,
        ownerId:req.user._id
    });

    if(!form){
        throw new ApiError(404,"Form not found or you don't have permission to view");
    }

    return res.status(200).json(
        new ApiResponse(200,form,"Form fetched successfully")
    );
});


const getFormPublic=asyncHandler(async(req,res)=>{
    const {formId}=req.params;

    const form=await Form.findOne({
        _id:formId,
        isActive:true
    }).select("title description fields settings.geofence settings.timeWindow settings.emailDomainWhitelist");

    if(!form){
        throw new ApiError(404,"Form not found or is no longer active");
    }

    return res.status(200).json(
        new ApiResponse(200,form,"Form fetched successfully")
    );
});


const updateForm=asyncHandler(async(req,res)=>{
    const {formId}=req.params;

    const {title,description,fields,settings} =req.body;

    console.log("Updating form with ID:", formId);
    console.log("User ID from token:", req.user._id);
    console.log("Update data:", {title, description, fields, settings});

    // Strip empty/invalid geofence so the 2dsphere index isn't triggered on junk data
    if (settings?.geofence) {
        const gf = settings.geofence;
        if (!gf.type || !gf.coordinates || (Array.isArray(gf.coordinates) && gf.coordinates.length === 0)) {
            delete settings.geofence;
        }
    }

    const form=await Form.findOneAndUpdate(
        {
            _id:formId,
            ownerId:req.user._id
        },
        {
            $set:{
                title,
                description,
                fields,
                settings
            }
        },
        {
            new:true,
            runValidators:true
        }
    )
    console.log("Updated form");
    if(!form){
        throw new ApiError(404,"Form not found or you don't have permission to edit");
    }

    return res.status(200).json(
        new ApiResponse(200,form,"Form updated successfully")
    );  


})
const fetchUserForms=asyncHandler(async(req,res)=>{
    const userId=req.user._id;
    const forms=await Form.find({ownerId:userId}).select("title description createdAt updatedAt");

    return res.status(200).json(
        new ApiResponse(200,forms,"User forms fetched successfully")
    );
});

export {createForm, getForm, getFormPublic, updateForm, fetchUserForms}; 