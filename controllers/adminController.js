const Admin = require("../models/Admin");
const jwt = require("jsonwebtoken");
const { sendPasswordResetEmail } = require("../utils/sendEmail");


//register
const register = async (req, res) => {
    const { fullName, contactNumber, email, password } = req.body;
  
    // Validate required fields
    if (!fullName || !contactNumber || !email || !password) {
      return res.status(400).json({
        message: "All fields (fullName, contactNumber, email, password) are required.",
      });
    }
  
    try {
      // Check if email or contact number already exists
      const existingAdmin = await Admin.findOne({
        $or: [{ email }, { contactNumber }],
      });
      if (existingAdmin) {
        return res.status(400).json({ message: "Email or Contact Number already exists." });
      }
  
      // Create new admin
      const newAdmin = new Admin({ fullName, contactNumber, email, password });
      await newAdmin.save();
  
      res.status(201).json({
        message: "Registration successful.",
        success: true,
        newAdmin
      });
    } catch (error) {
      console.error("Error during registration:", error);
      res.status(500).json({ message: "Server Error." });
    }
  };
  

// Login
const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: "1yr",
    });

    // Set token in a secure cookie
    res.cookie("token", token, {
      httpOnly: true, // Secure cookie from JavaScript access
      secure: process.env.NODE_ENV === "production", // Use secure cookie in production
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year expiration
    });

    return res.status(200).json({ message: "Login successful",  token, id: admin._id, success: true,  });
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({ message: "Server Error", success: false, error: error.message });
  }
};

// Forgot Password (Send OTP)
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ message: "Admin not found" });
    }

    const result = await sendPasswordResetEmail(admin);
    if (result.success) {
      res.json({ message: result.message });
    } else {
      return res.status(500).json({ message: result.message });
    }
  } catch (error) {
    console.error("Error in forgotPassword:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

// Verify OTP
const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ message: "Admin not found" });
    }

    if (!admin.otp || admin.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    if (admin.otp !== otp) {
      return res.status(400).json({ message: "Incorrect OTP" });
    }

    admin.isVerified = true; // Mark admin as verified
    admin.otp = undefined; // Clear OTP after verification
    admin.otpExpires = undefined;
    await admin.save();

    return res.json({
      message: "OTP verification successful. You can now reset your password.",
    });
  } catch (error) {
    console.error("Error in verifyOtp:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

//Update Admin
const updateAdmin = async (req, res) => {
    try {
      const { id } = req.params; // Get the user ID from request parameters
      const { fullName, contactNumber, email, password } = req.body;
  
      // Find the user by ID
      const admin = await Admin.findById(id);
      if (!admin) {
        return res.status(404).json({
          success: false,
          message: "Admin not found",
        });
      }
  
      // Update admin details if provided
      if (fullName) admin.fullName = fullName;
      if (contactNumber) admin.contactNumber = contactNumber;
      if (email) admin.email = email;

  
      // If password is provided, hash it and update
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        admin.password = hashedPassword;
      }
      await admin.save();
  
      return res.status(200).json({
        success: true,
        admin: admin,
        message: "Admin details updated successfully",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error updating user",
        error: error.message,
      });
    }
  };

// Reset Password
const resetPassword = async (req, res) => {
  const { email, newPassword, confirmNewPassword } = req.body;

  // Validate that both fields are provided
  if (!newPassword || !confirmNewPassword) {
    return res.status(400).json({
      message: "Both newPassword and confirmNewPassword are required.",
    });
  }

  // Validate that passwords match
  if (newPassword !== confirmNewPassword) {
    return res.status(400).json({
      message: "Passwords do not match.",
    });
  }

  try {
    const admin = await Admin.findOne({ email });
    if (!admin || !admin.isVerified) {
      return res.status(400).json({
        message: "OTP not verified. Reset password not allowed.",
      });
    }

    // Set new password and save
    admin.password = newPassword; // Pre-save middleware will hash this
    admin.isVerified = false; // Reset verification status after password change
    await admin.save();

    return res.json({ message: "Password reset successful." });
  } catch (error) {
    console.error("Error in resetPassword:", error);
    return res.status(500).json({ message: "Server Error." });
  }
};

//logout Admin
const logout = async (req, res) => {
  try {
    // Clear the token cookie
    res.clearCookie("token"); // Ensure the cookie is cleared
    return res.json({ message: "Logout successful." });
  } catch (error) {
    console.error("Error during logout:", error);
    return res.status(500).json({ message: "Server Error." });
  }
};

module.exports = { register, login, forgotPassword, updateAdmin, verifyOtp, resetPassword, logout };
