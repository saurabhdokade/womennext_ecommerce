const { Schema, model } = require("mongoose");
 
const deliveryBoySchema = new Schema(
    {
        fullName: {
            type: String,
            required: [true, "Full name is required"],
            trim: true,
            minlength: [3, "Full name must be at least 3 characters long"],
            maxlength: [50, "Full name cannot exceed 50 characters"],
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
        },
        phoneNumber: {
            type: Number,
            required: [true, "Phone number is required"],
            unique: true,
            validate: {
                validator: function (v) {
                    return /^[0-9]{10}$/.test(v);
                },
                message: "Phone number must be exactly 10 digits",
            },
        },
        userId: {
            type: String,
            required: [true, "User ID is required"],
            unique: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [6, "Password must be at least 6 characters long"],
        },
        address: {
            type: String,
            required: [true, "Address is required"],
            trim: true,
            minlength: [10, "Address must be at least 10 characters long"],
        },
        branch: {
            type: String,
            required: [true, "Branch is required"],
            trim: true,
        },
        image: {
            type: String,
            trim: true,
        },
    },
    { timestamps: true }
);
 
const DeliveryBoyModel = model("DeliveryBoy", deliveryBoySchema);
module.exports = DeliveryBoyModel;