const { client, twilioPhone } = require("../../config/twilo");
const jwt = require("jsonwebtoken");
const userModel = require("../../models/UserModels/User");
 
const login = async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        if (!phoneNumber)
            return res.status(400).json({ message: "Phone number is required" });
 
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry
 
        // Send OTP using Twilio
        await client.messages.create({
            body: `Your OTP is ${otp}`,
            from: twilioPhone,
            to: `+91${phoneNumber}`,
        });
 
        // Check if user exists
        let user = await userModel.findOne({ phoneNumber });
 
        if (user) {
            // If user exists, update OTP
            user.otp = otp;
            user.otpExpiresAt = otpExpiresAt;
            await user.save();
        } else {
            // If user doesn't exist, create new user
            user = new userModel({ phoneNumber, otp, otpExpiresAt });
            await user.save();
        }
 
        res.status(200).json({ message: "OTP sent successfully", success: true, data: {  otp } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};
 
const verifyOtp = async (req, res) => {
    try {
        const { phoneNumber, otp } = req.body;
        if (!phoneNumber || !otp)
            return res
                .status(400)
                .json({ message: "Phone number and OTP are required" });
 
        const user = await userModel.findOne({ phoneNumber });
 
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
 
        if (user.otp !== Number(otp)) {
            return res.status(400).json({ message: "Invalid OTP" });
        }
 
        if (user.otpExpiresAt < new Date()) {
            return res.status(400).json({ message: "OTP expired" });
        }
 
        // OTP verified → clear otp
        user.otp = null;
        user.otpExpiresAt = null;
        await user.save();
 
        const payload = { id: user._id };
        const token = jwt.sign(payload, process.env.JWT_SECRET);
 
        res.status(200).json({ message: "OTP verified successfully", token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};
 
const resendOtp = async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        if (!phoneNumber)
            return res.status(400).json({ message: "Phone number is required" });
 
        const user = await userModel.findOne({ phoneNumber });
 
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
 
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins
 
        // Send OTP
        await client.messages.create({
            body: `Your new OTP is ${otp}`,
            from: twilioPhone,
            to: `+91${phoneNumber}`,
        });
 
        // Update OTP
        user.otp = otp;
        user.otpExpiresAt = otpExpiresAt;
        await user.save();
 
        res.status(200).json({ message: "OTP resent successfully",success:true, data: {  otp } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};
 
const getUser = async (req, res) => {
    try {
        const user = await userModel
            .findById(req.user._id)
            .select("-otp -otpExpiresAt");
        if (!user) {
            return res
                .status(404)
                .json({ success: false, message: "User not found" });
        }
 
        res.status(200).json({ success: true, user });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};
 
const updateUser = async (req, res) => {
    try {
        const { fullName, phoneNumber, gender, email, address } =
            req.body;
        const image = req.file?.path;
 
        const user = await userModel
            .findById(req.user._id)
            .select("-otp -otpExpiresAt");
        if (!user) {
            return res
                .status(404)
                .json({ success: false, message: "User not found" });
        }
 
        if (fullName) user.fullName = fullName;
        if (phoneNumber) user.phoneNumber = phoneNumber;
        if (gender) user.gender = gender;
        if (email) user.email = email;
        if (address) user.address = address;
        if (image) user.image = image;
 
        await user.save();
        res.status(200).json({
            success: true,
            message: "User updated successfully!",
            user,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};
 
module.exports = { login, verifyOtp, resendOtp, getUser, updateUser };
 
 
 
 

 