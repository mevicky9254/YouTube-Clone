import { v2 as cloudinary } from 'cloudinary';
import { log } from 'console';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

console.log("Cloudinary Config: ", process.env.CLOUNDINARY_NAME, process.env.CLOUDINARY_API_KEY, process.env.CLODINARY_API_SECRET);

   cloudinary.config({ 
        cloud_name: process.env.CLOUNDINARY_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLODINARY_API_SECRET 
    });


    const uploadOnCloudinary = async (localFilePath)=>{
          
        try{
            if(!localFilePath) return null

           const response = await cloudinary.uploader.upload( localFilePath, {
               resource_type: "auto"
              }
            )
            console.log("File is uploaded successfully ", response.url);
            console.log("local path", localFilePath);
            if(fs.existsSync(localFilePath)){
                console.log("Local file exists, proceeding to delete it after upload");
            }
            fs.unlinkSync(localFilePath); //remove the locally saved file after uploading to cloudinary
            console.log("Local file deleted successfully after upload");
            console.log("Response from Cloudinary: ", response);
            return response;

        }catch(error){
           console.log("local path", localFilePath);
            if(fs.existsSync(localFilePath)){
                console.log("Local file exists, proceeding to delete it after upload");
            }
           fs.unlinkSync(localFilePath);//remove the locally saved file if operation gets failed.
           console.log(error);
           return null;
        }
    }

    export {uploadOnCloudinary};