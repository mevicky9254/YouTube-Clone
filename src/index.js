
import dotenv from "dotenv"

import connectDB from "./db/connectDB.js";

import { app } from "./app.js";

import { User } from "./models/User.model.js";

dotenv.config();

const PORT = process.env.PORT || 4000;

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log("Server is running on ", PORT);
        })
    })
.catch((err) =>{
   console.log(err);
});





