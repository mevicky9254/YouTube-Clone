
import dotenv from "dotenv"

import connectDB from "./db/connectDB.js";

import { app } from "./app.js";

import { User } from "./models/User.model.js";

dotenv.config();



const PORT = process.env.PORT || 4000;



app.post("/createUser", async (req, res) => {
  try {
    const userData = req.body;

    // Optional: add validation or password hashing here

    const user = new User(userData);
    await user.save();

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: user
    });
  } catch (error) {
    console.error("Error creating user:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to create user",
      error: error.message
    });
  }
});


connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log("Server is running on ", PORT);
        })
    })
.catch((err) =>{
   console.log(err);
});





