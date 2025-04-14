const BranchAdmin = require("../../models/BranchAdminModels/branchAdmin");
const jwt = require("jsonwebtoken");
const { sendPasswordResetEmail } = require("../../utils/sendEmail");


//✅ Register Branch Admin
const register = async (req, res) => {
  try {
    const { fullName, contactNumber, email, password, branch } = req.body;

    const profileImage = req.files?.profileImage?.[0]?.path;

    // Validate fields
    if (!fullName || !contactNumber || !email || !password || !branch) {
      return res.status(400).json({ msg: "All fields are required." });
    }

    // Check if admin already exists
    const admin = await BranchAdmin.findOne({ email });
    if (admin) {
      return res.status(400).json({ msg: "Email already exists." });
    }

    // Create new admin
    const newAdmin = new BranchAdmin({
      fullName,
      contactNumber,
      email,
      password,
      branch,
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

//✅ Login Branch Admin
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

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: "1yr",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year expiration
    });

    return res
      .status(200)
      .json({ message: "Login successful", token, id: admin._id });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error.", error: error.message });
  }
};

//✅ Forgot Password (Send OTP)
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  console.log(email);
  try {
    const admin = await BranchAdmin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ message: "Branch Admin not found" });
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

//✅ Get Branch Admin Profile
const getBranchAdminProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const branchAdmin = await BranchAdmin.findById(id)
      .populate("branch", "branchName")
      .select("fullName email contactNumber profileImage branch");
    
    if (!branchAdmin) {
      return res.status(404).json({ message: "Branch Admin not found." });
    }

    res.status(200).json({
      success: true,
      message: "Branch Admin profile fetched successfully.",
      data: branchAdmin,
    });
  } catch (error) {
    console.error("Error in getBranchAdminProfile:", error);
    res.status(500).json({
      message: "Server error.",
      error: error.message,
    });
  }
};
   
   
//✅ Update Branch Admin
const updateBranchAdminProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const branchAdmin = await BranchAdmin.findById(id)
      .populate("branch", "branchName fullAddress")
      .select("fullName email password contactNumber profileImage branch");
    if (!branchAdmin) {
      return res.status(404).json({ message: "Branch Admin not found." });
    }
    // Handle file upload for profileImage
    const profileImage = req.file ? req.file.path : null;
    if (profileImage) branchAdmin.profileImage = profileImage;
    if (req.body.fullName) branchAdmin.fullName = req.body.fullName;
    if (req.body.email) branchAdmin.email = req.body.email;
    if (req.body.contactNumber)
      branchAdmin.contactNumber = req.body.contactNumber;

    await branchAdmin.save();
    res.status(200).json({
      message: "Branch Admin profile updated successfully.",
      branchAdmin: {
        fullName: branchAdmin.fullName,
        email: branchAdmin.email,
        contactNumber: branchAdmin.contactNumber,
        profileImage: branchAdmin.profileImage,
        branch: {
          branchName: branchAdmin.branch.branchName,
          fullAddress: branchAdmin.branch.fullAddress,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error.",
      error: error.message,
    });
  }
};

//✅ Reset Password
const resetPassword = async (req, res) => {
  const { email, newPassword, confirmPassword } = req.body;

  if (!newPassword || !confirmPassword) {
    return res
      .status(400)
      .json({ message: "Both newPassword and confirmPassword are required." });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match." });
  }

  try {
    const admin = await BranchAdmin.findOne({ email });
    if (!admin || !admin.isVerified) {
      return res
        .status(400)
        .json({ message: "OTP not verified. Reset password not allowed." });
    }

    admin.password = newPassword;
    admin.isVerified = false;
    await admin.save();

    res.json({ message: "Password reset successful." });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

//✅ Change Password At Profile
const changeAdminPassAtProfile = async (req, res) => {
  try {
    const { id } = req.params; // Admin ID from the route parameter
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validate required fields
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res
        .status(400)
        .json({ message: "All password fields are required." });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    const admin = await BranchAdmin.findById(id);
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

//✅ Logout Branch Admin
const logout = async (req, res) => {
  try {
    res.clearCookie("token");
    res.json({ message: "Logout successful." });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

module.exports = {
  register,
  login,
  getBranchAdminProfile,
  forgotPassword,
  verifyOtp,
  updateBranchAdminProfile,
  changeAdminPassAtProfile,
  resetPassword,
  logout,
};
