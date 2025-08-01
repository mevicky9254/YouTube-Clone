import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError } from "../utils/apiError.js";
import { User } from "../models/User.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import fs from "fs";
import { log } from "console";
import jwt from "jsonwebtoken";

//create a function generateAccessToken and generateRefreshToken
const generateAccessTokenAndRefreshToken = async (userId) => {

    try {

        const user = await User.findById(userId);

        const accessToken =  user.generateAccessToken(); 

        const refreshToken =  user.generateRefreshToken();

        // Save the refresh token in the user's document
        user.refreshToken = refreshToken; 
    
        await user.save({validateBeforeSave: false});

        return { accessToken, refreshToken };

    } catch (error) {
        throw new ApiError(500, "Failed to generate tokens");
    }

}


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
        fs.unlinkSync(req.files?.avatar[0]?.path); //remove the locally saved file if user already exists
        if(req.files?.coverImage && req.files.coverImage.length > 0){
            fs.unlinkSync(req.files.coverImage[0].path); //remove the locally saved file if user already exists
        }
        throw new ApiError(400, "User already exists with this email or username");
    }

   const avatarLocalPath = req.files?.avatar[0]?.path;

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


const loginUser = asyncHandler(async (req, res) => {

    const {username, email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Please provide email and password");
    }
    // Here you would typically check the user's credentials against the database
    const user = await User.findOne({ $or: [{email}, {username}]});
    if (!user) {
        throw new ApiError(401, "Invalid credentials");
    }
   
    // Check if the password is correct
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials");
    }
   
    // Generate access and refresh tokens

    const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id);

    if(!accessToken || !refreshToken) {
        throw new ApiError(500, "Failed to generate tokens"); 
    }

    // set the refresh token and access token in the response cookie an return the user data
    const cookieOptions = {
        httpOnly: true,
        secure: true,
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    };

    return res.status(200)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .cookie("accessToken", accessToken, cookieOptions)
    .json(
        new ApiResponse(200, { user: user, refreshToken: refreshToken, accessToken: accessToken }, "User logged in successfully")
    );
});

const logoutUser = asyncHandler(async (req, res) => {
    // Logic for user logout will go here
    const userId = req.user._id;

    // Find the user and clear the refresh tokens
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    user.refreshToken = null;
    await user.save({ validateBeforeSave: false });

    // Clear the cookies
    return res.status(200)
        .cookie("refreshToken", "", { httpOnly: true, secure: true, maxAge: 0 })
        .cookie("accessToken", "", { httpOnly: true, secure: true, maxAge: 0 })
        .json(new ApiResponse(200, null, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!refreshToken) {
        throw new ApiError(401, "Refresh token is missing");
    }
    try {
        const decodedToken = jwt.verify(refreshToken, process.env.JWT_REFRESH_TOKEN);
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

        if (!user) {
            throw new ApiError(404, "Invalid refresh token");
        }

        if( user?.refreshToken !== refreshToken) {
            throw new ApiError(401, "Refresh token is expired");
        }

        // Generate new access token
        const {accessToken, newRefreshToken} = await generateAccessTokenAndRefreshToken(user._id);

        const cookieOptions = {
            httpOnly: true,
            secure: true,
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        }

        return res.status(200)
            .cookie("refreshToken", newRefreshToken, cookieOptions)
            .cookie("accessToken", accessToken, cookieOptions)
            .json(new ApiResponse(200, { user: user, accessToken: accessToken, refreshToken: newRefreshToken }, "Access token refreshed successfully"));

    } catch (error) {
        throw new ApiError(401, "Invalid or expired refresh token");
    }
})

const changePassword = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        throw new ApiError(400, "Please provide current and new password");
    }
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    // Check if the current password is correct
    const isPasswordValid = await user.isPasswordCorrect(currentPassword);  
    if (!isPasswordValid) {
        throw new ApiError(401, "Current password is incorrect");
    } 
    // Update the password
    user.password = newPassword;
    await user.save(validateBeforeSave = false );
    return res.status(200).json(new ApiResponse(200, null, "Password changed successfully"));
});


const getCurrentUser = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    const user = await User.findById(userId).select("-password -refreshToken");
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    return res.status(200).json(new ApiResponse(200, user, "User fetched successfully"));
});

const updateUser = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    const { fullName, email } = req.body; 

    if (!fullName || !email) {
        throw new ApiError(400, "Please provide all the required fields");
    }
  
    // Check if email is taken by another user
    const existingEmailUser = await User.findOne({ email, _id: { $ne: userId } });
    if (existingEmailUser) {
        throw new ApiError(409, "Email is already in use by another user");
    }

   const updatedUser = User.findByIdAndUpdate(userId,
        {
          $set: {
                  fullName,
                  email
                }
        }, 
        {new: true,}).select("-password -refreshToken");
   
    return res.status(200).json(new ApiResponse(200, updatedUser, "User updated successfully"));
})


const updateAvatar = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Please provide avatar");
    }
    const avatarResponse = await uploadOnCloudinary(avatarLocalPath);
    if (!avatarResponse) {
        throw new ApiError(500, "Failed to upload avatar on cloudinary");
    }
    
    const user = await User.findByIdAndUpdate(userId, {
        $set: {
            avatar: avatarResponse.url
        }
    }, { new: true }).select("-password -refreshToken");
    
    // Remove the locally saved file 
    fs.unlinkSync(avatarLocalPath);
    return res.status(200).json(new ApiResponse(200, user, "Avatar updated successfully"));
})

const updateCoverImage = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const coverImageLocalPath = req.file?.path;
    if (!coverImageLocalPath) {
        throw new ApiError(400, "Please provide cover image");
    }
    const coverImageResponse = await uploadOnCloudinary(coverImageLocalPath);
    if (!coverImageResponse) {
        throw new ApiError(500, "Failed to upload cover image on cloudinary");
    }
    const user = await User.findByIdAndUpdate(userId, {
        $set: {
            coverImage: coverImageResponse.url
        }
    }, { new: true }).select("-password -refreshToken");

    return res.status(200).json(new ApiResponse(200, user, "Cover image updated successfully"));
})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    getCurrentUser,
    updateUser,
    updateAvatar
}