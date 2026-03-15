
import {Form} from "../models/form.model.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import { getEntitlementForUser } from "../services/subscription.service.js";

const createForm=asyncHandler(async(req,res)=>{
    const {
        title,
        description,
        fields=[],
        settings={}    }=req.body;

    const ownerId=req.user._id;

    if(!ownerId){
        throw new ApiError(400,"Owner ID is required to create form");
    }

    const entitlement = req.entitlement || await getEntitlementForUser(ownerId);

    if (!entitlement.isActive) {
        throw new ApiError(403, "Active subscription required to create forms");
    }

    const maxForms = entitlement.features?.maxForms;
    if (Number.isFinite(maxForms)) {
        const currentFormCount = await Form.countDocuments({ ownerId });
        if (currentFormCount >= maxForms) {
            throw new ApiError(403, `Your plan allows only ${maxForms} forms`);
        }
    }

    if (settings?.geofence && !entitlement.features?.allowGeofence) {
        throw new ApiError(403, "Current plan does not allow geofence");
    }

    const form = await Form.create({
        ownerId,
        title,
        description,
        fields,
        settings           
    })

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

    const {title,description,fields,settings,isActive} =req.body;

    const entitlement = req.entitlement || await getEntitlementForUser(req.user._id);

    if (!entitlement.isActive) {
        throw new ApiError(403, "Active subscription required to update forms");
    }

    if (settings?.geofence && !entitlement.features?.allowGeofence) {
        throw new ApiError(403, "Current plan does not allow geofence");
    }

    // Build $set dynamically so we only touch fields that were actually sent
    const updateFields = {};
    if (title !== undefined)       updateFields.title = title;
    if (description !== undefined) updateFields.description = description;
    if (fields !== undefined)      updateFields.fields = fields;
    if (isActive !== undefined)    updateFields.isActive = Boolean(isActive);

    // Merge settings with dot-notation so partial updates don't wipe sibling keys
    if (settings) {
        if (settings.geofence !== undefined) {
            const gf = settings.geofence;
            // Strip empty/invalid geofence so the 2dsphere index isn't triggered on junk
            if (gf && gf.type && gf.coordinates &&
                !(Array.isArray(gf.coordinates) && gf.coordinates.length === 0)) {
                updateFields["settings.geofence"] = gf;
            } else {
                updateFields["settings.geofence"] = undefined; // clear it
            }
        }
        if (settings.emailDomainWhitelist !== undefined)
            updateFields["settings.emailDomainWhitelist"] = settings.emailDomainWhitelist;
        if (settings.submissionLimitPerUser !== undefined)
            updateFields["settings.submissionLimitPerUser"] = settings.submissionLimitPerUser;
        if (settings.timeWindow !== undefined)
            updateFields["settings.timeWindow"] = settings.timeWindow;
        if (settings.maxFileSizeMB !== undefined)
            updateFields["settings.maxFileSizeMB"] = settings.maxFileSizeMB;
        if (settings.allowedFileTypes !== undefined)
            updateFields["settings.allowedFileTypes"] = settings.allowedFileTypes;
    }

    const form=await Form.findOneAndUpdate(
        {
            _id:formId,
            ownerId:req.user._id
        },
        { $set: updateFields },
        {
            new:true,
            runValidators:true
        }
    )
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