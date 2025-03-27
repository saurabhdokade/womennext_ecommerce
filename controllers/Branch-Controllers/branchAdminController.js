const BranchAdmin = require('../../models/BranchModels/branchAdmin')
const jwt  =  require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const {sendPasswordResetEmail}  = require("../../utils/sendEmail")
 
// Register Branch Admin
const register = async (req, res) => {
    const { fullName, contactNumber, email, password } = req.body;
  
    if (!fullName || !contactNumber || !email || !password) {
      return res.status(400).json({
        message: "All fields (fullName, contactNumber, email, password) are required.",
      });
    }
  
    try {
      const existingAdmin = await BranchAdmin.findOne({
        $or: [{ email }, { contactNumber }],
      });
      if (existingAdmin) {
        return res.status(400).json({ message: "Email or Contact Number already exists." });
      }
  
      const newAdmin = new BranchAdmin({ fullName, contactNumber, email, password });
      await newAdmin.save();
  
      res.status(201).json({ message: "Registration successful.", newAdmin });
    } catch (error) {
      res.status(500).json({ message: "Server error.", error: error.message });
    }
  };
  
  // Login Branch Admin
  const login = async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const admin = await BranchAdmin.findOne({ email });
      if (!admin) {
        return res.status(400).json({ message: "Invalid Credentials" });
      }
  
      const isMatch = await admin.matchPassword(password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid Credentials" });
      }
  
      const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: "1yr" });
  
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year expiration
      });
  
      res.status(200).json({ message: "Login successful", token, id: admin._id });
    } catch (error) {
      res.status(500).json({ message: "Server error.", error: error.message });
    }
  };
  
  // Forgot Password (Send OTP)
  const forgotPassword = async (req, res) => {
    const { email } = req.body;
  
    try {
      const admin = await BranchAdmin.findOne({ email });
      if (!admin) {
        return res.status(400).json({ message: "Branch Admin not found." });
      }
  
      const result = await sendPasswordResetEmail(admin);
      if (result.success) {
        res.json({ message: result.message });
      } else {
        res.status(500).json({ message: result.message });
      }
    } catch (error) {
      res.status(500).json({ message: "Server error.", error: error.message });
    }
  };
  
  // Verify OTP
  const verifyOtp = async (req, res) => {
    const { email, otp } = req.body;
  
    try {
      const admin = await BranchAdmin.findOne({ email });
      if (!admin) {
        return res.status(400).json({ message: "Branch Admin not found." });
      }
  
      if (!admin.otp || admin.otpExpires < Date.now()) {
        return res.status(400).json({ message: "Invalid or expired OTP." });
      }
  
      if (admin.otp !== otp) {
        return res.status(400).json({ message: "Incorrect OTP." });
      }
  
      admin.isVerified = true;
      admin.otp = undefined;
      admin.otpExpires = undefined;
      await admin.save();
  
      res.json({ message: "OTP verified. You can reset your password now." });
    } catch (error) {
      res.status(500).json({ message: "Server error.", error: error.message });
    }
  };
  
  // Update Branch Admin
  const updateAdmin = async (req, res) => {
    try {
      const { id } = req.params;
      const { fullName, contactNumber, email, password } = req.body;
  
      const admin = await BranchAdmin.findById(id);
      if (!admin) {
        return res.status(404).json({ message: "Branch Admin not found." });
      }
  
      if (fullName) admin.fullName = fullName;
      if (contactNumber) admin.contactNumber = contactNumber;
      if (email) admin.email = email;
  
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        admin.password = hashedPassword;
      }
  
      await admin.save();
      res.json({ message: "Branch Admin updated successfully.", admin });
    } catch (error) {
      res.status(500).json({ message: "Server error.", error: error.message });
    }
  };
  
  // Reset Password
  const resetPassword = async (req, res) => {
    const { email, newPassword, confirmNewPassword } = req.body;
  
    if (!newPassword || !confirmNewPassword) {
      return res.status(400).json({ message: "Both newPassword and confirmNewPassword are required." });
    }
  
    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }
  
    try {
      const admin = await BranchAdmin.findOne({ email });
      if (!admin || !admin.isVerified) {
        return res.status(400).json({ message: "OTP not verified. Reset password not allowed." });
      }
  
      admin.password = newPassword;
      admin.isVerified = false;
      await admin.save();
  
      res.json({ message: "Password reset successful." });
    } catch (error) {
      res.status(500).json({ message: "Server error.", error: error.message });
    }
  };
  
  // Logout Branch Admin
  const logout = async (req, res) => {
    try {
      res.clearCookie("token");
      res.json({ message: "Logout successful." });
    } catch (error) {
      res.status(500).json({ message: "Server error.", error: error.message });
    }
  };
  
  module.exports = { register, login, forgotPassword, verifyOtp, updateAdmin, resetPassword, logout };