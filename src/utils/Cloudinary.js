import { v2 as cloudinary } from 'cloudinary';
import { log } from 'console';
import fs from 'fs';

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

            return response;

        }catch(error){
            fs.unlinkSync(localFilePath);//remove the locally saved file if operation gets failed.
           console.log(error);
           return null;
        }
    }

    export {uploadOnCloudinary};