import express from "express";

import cookieParser from "cookie-parser";

import cors from "cors";


const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}));

//Setting for accepting json data
app.use(express.json({limit: "16kb"}));

//setting for accepting data through url
app.use(express.urlencoded({extended: true, limit: "16kb"}));

//setting for accessing static data like assets, images and all from public folder
app.use(express.static("public"));

//setting cookie
app.use(cookieParser());

export {app};