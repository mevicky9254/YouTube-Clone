import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError } from "../utils/apiError.js";
import { User } from "../models/User.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import fs from "fs";

const registerUser = asyncHandler (async (req, res) =>{
   //Take the data from the request body
   //validate the data
   //check if the user already exists
   //if user exists, send error messgae
   //if the user does not exist, create the user
   //check for the avatar and cover image
   //if avatar and cover image are present, save them to the user
   // save the avtar and cover image on cloudinary
   // create the user in the database
   //verify if the user is created successfully
   //if user is created successfully, send the response back to the user
   

   const{fullName, username, email, password} = req.body;
   
    if(!fullName || !username || !email || !password){
       throw new ApiError(400, "Please provide all the required fields");
    }

    const userExists = await User.findOne({ $or: [{email}, {username}] });

    if(userExists){
        throw new ApiError(400, "User already exists with this email or username");
    }

   const avatarLocalPath = req.files?.avatar[0]?.path;

   console.log("Avatar Local Path: ", avatarLocalPath);

   if(!avatarLocalPath){
       throw new ApiError(400, "Please provide avatar");
   }

   let coverImageLocalPath 
   if(req.files?.coverImage && req.files.coverImage.length > 0){
       coverImageLocalPath = req.files.coverImage[0].path;
    }

   console.log("Cover Image Local Path: ", coverImageLocalPath);

   const avatarResponse = await uploadOnCloudinary(avatarLocalPath);
   if(!avatarResponse){
       throw new ApiError(500, "Failed to upload avatar on cloudinary");
   }

   const coverImageResponse = await uploadOnCloudinary(coverImageLocalPath);

   const user = await User.create({
       fullName,
       username,
       email,
       password,
       avatar: avatarResponse.url,
       coverImage: coverImageResponse?.url || ""
   })

   const createdUser = await User.findById(user._id).select("-password -refreshTokens");


   if(!createdUser){
       throw new ApiError(500, "Failed to create user while registering");
   }

   
   return res.status(201).json(
       new ApiResponse(201, createdUser, "User registered successfully")
   );

})

export {
    registerUser
}