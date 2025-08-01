import { Router } from "express";
import {loginUser, registerUser,logoutUser,refreshAccessToken,updateAvatar,updateUser,changePassword,getCurrentUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { JwtValidate } from "../middlewares/auth.middleware.js";



const router = Router();

router.route("/register").post(
    
        upload.fields([
            {name: "avatar", maxCount : 1},
            {name: "coverImage", maxCount: 1}
        ]), registerUser);

router.route("/login").post(loginUser);

//secure routes
router.route("/logout").post(JwtValidate, logoutUser); 
router.route("/refresh-token").post(refreshAccessToken); 
router.route("/current-user").get(JwtValidate, getCurrentUser);

router.route("/update-avatar").put(JwtValidate, upload.single("avatar"), updateAvatar);
router.route("/update-user").put(JwtValidate, updateUser);
router.route("/change-password").put(JwtValidate, changePassword);

export default router;