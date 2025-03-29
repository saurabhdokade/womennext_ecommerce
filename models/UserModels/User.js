const { Schema, model } = require("mongoose");
 
const userSchema = new Schema(
    {
        phoneNumber: {
            type: Number,
            unique: true,
            required: true,
        },
        fullName: {
            type: String,
            default: "",
        },
        image: {
            type: String,
            default: "",
        },
        gender: {
            type: String,
            enum: ["Male", "Female", ""],
            default: "",
        },
        email: {
            type: String,
            default: "",
        },
        address: {
            type: String,
            default: "",
        },
        otp: {
            type: Number,
        },
        otpExpiresAt: {
            type: Date,
        },
    },
    { timestamps: true }
);
 
const userModel = model("User", userSchema);
module.exports = userModel;
 
 
 