const branchModel = require("../../models/SuperAdminModels/branch");
const bcrypt = require("bcryptjs");

const createBranch = async (req, res) => {
  try {
    const {
      branchName,
      branchPersonName,
      email,
      password,
      phoneNumber,
      fullAddress,
      servicePinCode,
    } = req.body;

    //existing Branch
    const existingBranch = await branchModel.findOne({ email });
    if (existingBranch) {
      return res
        .status(400)
        .json({ message: "Branch with this email already exists" });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    //Create new Branch
    const newBranch = new branchModel({
      branchName,
      branchPersonName,
      email,
      password: hashedPassword,
      phoneNumber,
      fullAddress,
      servicePinCode,
    });

    await newBranch.save();
    return res
      .status(201)
      .json({
        message: "Branch created successfully",
        success: true,
        newBranch,
      });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Internal Server Error", success: false });
  }
};

//Get all Branch
const getAllBranches = async (req, res) => {
  try {
    let { page, limit, searchQuery, sortBy, sortOrder } = req.query;

    // Default values for pagination
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const skip = (page - 1) * limit;

    //Implemented Sort
    sortBy = sortBy || "branchName"; // Default sorting by branchName
    sortOrder = sortOrder === "desc" ? -1 : 1;

    // Search filter (case-insensitive)
    let query = {};
    if (searchQuery) {
      query = {
        $or: [
          { branchName: { $regex: searchQuery, $options: "i" } },
          { branchPersonName: { $regex: searchQuery, $options: "i" } },
          { email: { $regex: searchQuery, $options: "i" } },
          { password: { $regex: searchQuery, $options: "i" } },
          { phoneNumber: { $regex: searchQuery, $options: "i" } },
          { servicePinCode: { $regex: searchQuery, $options: "i" } },
          { fullAddress: { $regex: searchQuery, $options: "i" } },
        ],
      };
    }

    // Fetch branches with pagination
    const branches = await branchModel
      .find(query)
      .select("+password") // Exclude password field for security
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit);


    // Total count for pagination
    const totalBranches = await branchModel.countDocuments(query);
    const totalPages = Math.ceil(totalBranches / limit);
    const hasPrevious = page > 1;
    const hasNext = page < totalPages;

    return res.status(200).json({
      totalBranches,
      totalPages: Math.ceil(totalBranches / limit),
      currentPage: page,
      hasPrevious,
      hasNext,
      branches,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Internal Server Error", success: false, error: error.message });
  }
};

//get Branch by id
const getBranchById = async (req, res) => {
  try {
    const { id } = req.params;
    const branch = await branchModel.findById(id);
    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }
    return res.status(200).json({ message: "Branch found", success: true, branch });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Internal Server Error", success: false, error: error.message });
  }
};



//Update Branch
const updateBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const branch = await branchModel.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }
    return res.status(200).json({ message: "Branch updated successfully", success: true, branch });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Internal Server Error", success: false, error: error.message });
  }
};

//Delete Branch
const deleteBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const branch = await branchModel.findByIdAndDelete(id);
    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }
    return res.status(200).json({ message: "Branch deleted successfully", success: true, branch });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Internal Server Error", success: false, error: error.message });
  }
};

module.exports = {
  createBranch,
  getAllBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
};
