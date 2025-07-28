import express from "express";

import cookieParser from "cookie-parser";

import cors from "cors";


const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}));


app.use(express.json({limit: "16kb"})); //Setting for accepting json data
app.use(express.urlencoded({extended: true, limit: "16kb"})); //setting for accepting data through url
app.use(express.static("public")); //setting for accessing static data like assets, images and all from public folder
app.use(cookieParser()); //setting cookie

//routes import
import userRouter from "./routes/user.routes.js";

//routes declaration
app.use("/api/v1/users", userRouter);

export {app};