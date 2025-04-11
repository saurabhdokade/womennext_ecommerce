const SuperAdmin = require("../../models/SuperAdminModels/SuperAdmin");
const jwt = require("jsonwebtoken");
const { sendPasswordResetEmail } = require("../../utils/sendEmail");
const bcrypt = require("bcryptjs");

//✅ register
const register = async (req, res) => {
  try {
    const { fullName, contactNumber, email, password } = req.body;

    const profileImage = req.files?.profileImage?.[0]?.path;
    // Validate fields
    if (!fullName || !contactNumber || !email || !password) {
      return res.status(400).json({ msg: "All fields are required." });
    }

    // Check if admin already exists
    const admin = await SuperAdmin.findOne({ email });
    if (admin) {
      return res.status(400).json({ msg: "Email already exists." });
    }

    // Create new admin
    const newAdmin = new SuperAdmin({
      fullName,
      contactNumber,
      email,
      password,
      profileImage: profileImage,
    });

    // Save admin to database
    await newAdmin.save();

    return res.status(201).json({
      success: true,
      msg: "Registration successful",
      data: newAdmin,
    });
  } catch (error) {
    console.error("Error in register:", error);
    return res
      .status(500)
      .json({ msg: "Internal Server Error", error: error.message });
  }
};

//✅ login
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await SuperAdmin.findOne({ email });
    if (!admin) {
      // console.log("Admin Not Found");
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    const isMatch = await admin.matchPassword(password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: "1yr",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 365 * 24 * 60 * 60 * 1000,
    });

    return res
      .status(200)
      .json({
        message: "Login successful",
        token,
        id: admin._id,
        success: true,
      });
  } catch (error) {
    console.error("Error during login:", error);
    return res
      .status(500)
      .json({ message: "Server Error", success: false, error: error.message });
  }
};

//✅ Forgot Password (Send OTP)
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const admin = await SuperAdmin.findOne({ email });
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

//✅ Verify OTP
const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const admin = await SuperAdmin.findOne({ email });
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

//✅ Get Admin Profile
const getAdminProfile = async (req, res) => {
  try {
    const { id } = req.params; // Admin ID from the route parameter
    const admin = await SuperAdmin.findById(id).select(
      "profileImage fullName email password"
    ); // Select only fullName, email, and password

    if (!admin) {
      return res.status(404).json({ message: "Admin not found." });
    }

    // Debugging: Log the admin data for debugging purposes
    // console.log("Admin Profile Fetched:", admin);

    res.status(200).json({
      success: true,
      profile: admin,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error.",
      error: error.message,
    });
  }
};

//✅ Update Admin
const updateAdminProfile = async (req, res) => {
  try {
    const { id } = req.params; // Get the user ID from request parameters
    const { fullName, email, password } = req.body;
    const { profileImage } = req.files;
    // Find the user by ID
    const admin = await SuperAdmin.findById(id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    // Update admin details if provided
    if (fullName) admin.fullName = fullName;
    if (email) admin.email = email;

    // If password is provided, hash it and update
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      admin.password = hashedPassword;
    }
    if (profileImage) {
      admin.profileImage = profileImage[0].path;
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

//✅ Reset Password
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
    const admin = await SuperAdmin.findOne({ email });
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

//✅ Change Password At Profile
const changeAdminPasswordAtProfile = async (req, res) => {
  try {
    const { id } = req.params; // Admin ID from the route parameter
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    // Validate required fields
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res
        .status(400)
        .json({ message: "All password fields are required." });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    const admin = await SuperAdmin.findById(id);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found." });
    }

    // Check if the current password is correct
    const isMatch = await admin.matchPassword(currentPassword);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Current password is incorrect." });
    }

    // Update password
    admin.password = newPassword; // The `pre-save` middleware will hash the password
    await admin.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error.",
      error: error.message,
    });
  }
};

//✅ logout Admin
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

module.exports = {
  register,
  login,
  forgotPassword,
  getAdminProfile,
  updateAdminProfile,
  verifyOtp,
  resetPassword,
  changeAdminPasswordAtProfile,
  logout,
};
