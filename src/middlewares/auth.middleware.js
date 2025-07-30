import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError } from "../utils/apiError.js";
import {User} from "../models/User.model.js";
import jwt from "jsonwebtoken";


const JwtValidate = asyncHandler(async (req, res, next) => {
   
    try {
        const token = req.cookies.accessToken || req.headers.authorization?.split(" ")[1];
        if (!token) {
            throw new ApiError(401, "Access token is missing"); 
        }
        const decodedToken  = jwt.verify(token, process.env.JWT_ACCESS_TOKEN);

        const user = await User.findById(decodedToken._id).select("-password -refreshToken");

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        req.user = user;
        
        next();

    } catch (error) {
       throw new ApiError(401, "Invalid or expired access token");
    }
});
export { JwtValidate };