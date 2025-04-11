const branchModel = require("../../models/SuperAdminModels/branch");
const DeliveryBoyModel = require("../../models/SuperAdminModels/DeliveryBoy");
const ProductModel = require("../../models/SuperAdminModels/Product");
const bcrypt = require("bcryptjs");


//✅ Create Branch
const createBranch = async (req, res) => {
    try {
        const {
            branchName,
            branchManagerName,
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
      branchManagerName,
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

//✅ Get all Branch
const getAllBranches = async (req, res) => {
  try {
    let { page, limit, searchQuery, sortBy, sortOrder } = req.query;

    // Default values
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const skip = (page - 1) * limit;

    // Sort
    sortBy = sortBy || "branchName";
    sortOrder = sortOrder === "desc" ? -1 : 1;

    // Search filter
    let query = {};
    if (searchQuery) {
      query = {
        $or: [
          { branchName: { $regex: searchQuery, $options: "i" } },
          { branchManagerName: { $regex: searchQuery, $options: "i" } },
          { servicePinCode: { $regex: searchQuery, $options: "i" } },
        ],
      };
    }

    // Fetch branches
    const rawBranches = await branchModel
      .find(query)
      .select("branchName branchManagerName servicePinCode")
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit);

    // Format servicePinCode as comma-separated string
    const branches = rawBranches.map(branch => ({
      branchName: branch.branchName,
      branchManagerName: branch.branchManagerName,
      servicePinCode: Array.isArray(branch.servicePinCode)
        ? branch.servicePinCode.join(', ')
        : branch.servicePinCode,
    }));

    // Pagination
    const totalBranches = await branchModel.countDocuments(query);
    const totalPages = Math.ceil(totalBranches / limit);
    const hasPrevious = page > 1;
    const hasNext = page < totalPages;

    return res.status(200).json({
      totalBranches,
      totalPages,
      currentPage: page,
      hasPrevious,
      hasNext,
      branches,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
      error: error.message
    });
  }
};


//✅ Get Branch by id
const getBranchById = async (req, res) => {
  try {
    const { id } = req.params;

    // Step 1: Find the branch
    const rawbranch = await branchModel.findById(id)
    .select({ phoneNumber: 1, servicePinCode: 1, fullAddress: 1, _id: 0 })
    .lean();

    if (!rawbranch) {
      return res.status(404).json({ message: "Branch not found", success: false });
    }

    const branch = {
      ...rawbranch,
      servicePinCode: Array.isArray(rawbranch.servicePinCode)
        ? rawbranch.servicePinCode.join(", ")
        : rawbranch.servicePinCode,
    };

    // Step 2: Get delivery boys
    const deliveryBoys = await DeliveryBoyModel.find({})
      .select("userId fullName email phoneNumber address")
      .lean();

    const formattedDeliveryBoys = deliveryBoys.map((boy) => ({
      userId: boy.userId,
      deliveryBoyName: boy.fullName,
      emailAddress: boy.email,
      PhoneNumber: boy.phoneNumber,
      Address: boy.address,
    }));

    // Step 3: Get products
    const products = await ProductModel.find({})
      .select("productCode brand productName size availableProductQuantity price")
      .lean();

    const formattedProducts = products.map((product) => ({
      id: product._id,
      productCode: product.productCode,
      brand: product.brand,
      productName: product.productName,
      size: product.size,
      availableQuantity: product.availableProductQuantity,
      price: product.price,
    }));

    // Step 4: Return response
    return res.status(200).json({
      success: true,
      message: "Branch details fetched successfully",
      branch,
      availableDeliveryBoys: formattedDeliveryBoys,
      availableProductDetails: formattedProducts,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
      error: error.message,
    });
  }
};





//Update Branch
const updateBranch = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate input
    if (req.body.servicePinCode && !Array.isArray(req.body.servicePinCode)) {
      return res.status(400).json({
        message: "servicePinCode should be an array of 6-digit numbers",
        success: false,
      });
    }

    // Fetch existing branch
    const existingBranch = await branchModel.findById(id);

    if (!existingBranch) {
      return res.status(404).json({ message: "Branch not found", success: false });
    }

    // Merge servicePinCode arrays
    if (req.body.servicePinCode) {
      const updatedPins = req.body.servicePinCode;

      // Merge & remove duplicates
      const mergedPins = Array.from(new Set([...existingBranch.servicePinCode, ...updatedPins]));

      req.body.servicePinCode = mergedPins;
    }

    // Update branch
    const updatedBranch = await branchModel.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      message: "Branch updated successfully",
      success: true,
      branch: updatedBranch,
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
      error: error.message,
    });
  }
};



//Delete Branch
const deleteBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const { servicePinCode } = req.query;

    const branch = await branchModel.findById(id);
    if (!branch) {
      return res.status(404).json({ message: "Branch not found", success: false });
    }

    // Handle pin code removal
    if (servicePinCode) {
      const normalizedPin = servicePinCode.trim();
      const pinIndex = branch.servicePinCode.indexOf(normalizedPin);

      if (pinIndex === -1) {
        return res.status(404).json({
          message: "Service pin code not found in this branch",
          success: false,
        });
      }

      branch.servicePinCode.splice(pinIndex, 1);
      await branch.save();

      return res.status(200).json({
        message: `Service pin code ${normalizedPin} removed from branch successfully`,
        success: true,
        branch,
      });
    }

    // Delete entire branch
    await branchModel.findByIdAndDelete(id);
    return res.status(200).json({
      message: "Branch deleted successfully",
      success: true,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
      error: error.message,
    });
  }
};


// get Available Delivery Boys
const availableDeliveryBoys = async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
 
    const totalCount = await DeliveryBoyModel.countDocuments({});
 
    const deliveryBoys = await DeliveryBoyModel.find({})
      .select("userId fullName email phoneNumber address")
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
 
    const totalPages = Math.ceil(totalCount / limit);
    const hasPrevious = page > 1;
    const hasNext = page < totalPages;
 
    // Map and rename fields
    const formattedBoys = deliveryBoys.map((boy) => ({
      userId: boy.userId,
      deliveryBoyName: boy.fullName,
      emailAddress: boy.email,
      phoneNumber: boy.phoneNumber,
      address: boy.address,
    }));
 
    res.status(200).json({
      success: true,
      totalPages,
      currentPage: page,
      previous: hasPrevious,
      next: hasNext,
      deliveryBoys: formattedBoys,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
 
// get available products
const availableProducts = async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
 
    const totalCount = await ProductModel.countDocuments({});
 
    const products = await ProductModel.find({})
      .select(
        "productCode brand productName size availableProductQuantity price"
      )
      .skip((page - 1) * limit)
      .limit(limit);
 
    const totalPages = Math.ceil(totalCount / limit);
    const hasPrevious = page > 1;
    const hasNext = page < totalPages;
 
    const formattedProducts = products.map((product) => ({
      productCode: product.productCode,
      brand: product.brand,
      productName: product.productName,
      size: product.size,
      availableQuantity: product.availableProductQuantity,
      price: product.price,
    }));
 
    res.status(200).json({
      success: true,
      totalPages,
      currentPage: page,
      previous: hasPrevious,
      next: hasNext,
      products: formattedProducts,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createBranch,
  getAllBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
  availableDeliveryBoys,
  availableProducts,
};
