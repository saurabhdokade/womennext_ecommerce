const branchModel = require("../../models/SuperAdminModels/branch");
const DeliveryBoyModel = require("../../models/SuperAdminModels/DeliveryBoy");
const BranchAdminProductModel = require("../../models/BranchAdminModels/branchAdminProducts");
const mongoose = require("mongoose");
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
    return res.status(201).json({
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
    const branches = rawBranches.map((branch) => ({
      id: branch._id,
      branchName: branch.branchName,
      branchManagerName: branch.branchManagerName,
      servicePinCode: Array.isArray(branch.servicePinCode)
        ? branch.servicePinCode.join(", ")
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
      error: error.message,
    });
  }
};

//✅ Get Branch by id
const getBranchById = async (req, res) => {
  try {
    const { id } = req.params;

    // Step 1: Find the branch
    const rawbranch = await branchModel
      .findById(id)
      .select({
        phoneNumber: 1,
        servicePinCode: 1,
        fullAddress: 1,
        _id: 1,
        branchName: 1,
      })
      .lean();

    if (!rawbranch) {
      return res
        .status(404)
        .json({ message: "Branch not found", success: false });
    }

    const branch = {
      phoneNumber: rawbranch.phoneNumber,
      address: rawbranch.fullAddress,
      servicePinCode: Array.isArray(rawbranch.servicePinCode)
        ? rawbranch.servicePinCode.join(", ")
        : rawbranch.servicePinCode,
    };

    // Step 2: Get delivery boys and products
    const [deliveryBoys, products] = await Promise.all([
      DeliveryBoyModel.find({ branch: rawbranch.branchName })
        .select("userId fullName email phoneNumber address")
        .sort({ createdAt: -1 })
        .limit(3)
        .lean(),

      BranchAdminProductModel.find({ branch: id })
        .populate("product")
        .sort({ createdAt: -1 })
        .limit(3)
        .lean(),
    ]);

    const formattedDeliveryBoys = deliveryBoys.map((boy) => ({
      userId: boy.userId,
      deliveryBoyName: boy.fullName,
      emailAddress: boy.email,
      PhoneNumber: boy.phoneNumber,
      Address: boy.address,
    }));

    const formattedProducts = products.map((product) => ({
      productCode: product.product?.productCode || "",
      brand: product.product?.brand || "",
      productName: product.product?.productName || "",
      size: product.product?.size || "",
      availableQuantity: product.quantity || 0,
      price: product.product?.price || "",
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

//✅ Update Branch
const updateBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      branchName,
      branchManagerName,
      email,
      password,
      phoneNumber,
      fullAddress,
      servicePinCode
    } = req.body;

    // Validate servicePinCode if provided
    let uniquePinCodes;
    if (servicePinCode) {
      if (!Array.isArray(servicePinCode)) {
        return res.status(400).json({
          message: "servicePinCode should be an array of 6-digit numbers",
          success: false,
        });
      }

      const isValid = servicePinCode.every(pin => /^\d{6}$/.test(pin.toString()));
      if (!isValid) {
        return res.status(400).json({
          message: "Each pin code must be a valid 6-digit number",
          success: false,
        });
      }

      uniquePinCodes = [...new Set(servicePinCode.map(pin => pin.toString()))];
    }

    const existingBranch = await branchModel.findById(id);
    if (!existingBranch) {
      return res.status(404).json({
        message: "Branch not found",
        success: false,
      });
    }

    if (branchName !== undefined) existingBranch.branchName = branchName;
    if (branchManagerName !== undefined) existingBranch.branchManagerName = branchManagerName;
    if (email !== undefined) existingBranch.email = email;
    if (password !== undefined) existingBranch.password = password; 
    if (phoneNumber !== undefined) existingBranch.phoneNumber = phoneNumber;
    if (fullAddress !== undefined) existingBranch.fullAddress = fullAddress;
    if (uniquePinCodes !== undefined) existingBranch.servicePinCode = uniquePinCodes;


    if (password !== undefined) {
      const salt = await bcrypt.genSalt(10);
      existingBranch.password = await bcrypt.hash(password, salt);
    }
    const updatedBranch = await existingBranch.save();

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

//✅ Delete Branch
const deleteBranch = async (req, res) => {
  try {
    const { id } = req.params;

    // Delete entire branch
    await branchModel.findByIdAndUpdate(id, { isDeleted: true });
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

//✅ get Available Delivery Boys
const availableDeliveryBoys = async (req, res) => {
  try {
    const { branchId } = req.params;
    let { page = 1, limit = 10 } = req.query;

    // Convert and validate pagination inputs
    page = Math.max(1, parseInt(page, 10));
    limit = Math.max(1, parseInt(limit, 10));

    // Validate MongoDB ObjectId format
    if (!branchId || !/^[0-9a-fA-F]{24}$/.test(branchId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid branch ID",
      });
    }

    // Fetch branchName only
    const branch = await branchModel
      .findById(branchId)
      .select("branchName")
      .lean();
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    const query = { branch: branch.branchName };

    // Execute both count and find operations in parallel
    const [totalCount, deliveryBoys] = await Promise.all([
      DeliveryBoyModel.countDocuments(query),
      DeliveryBoyModel.find(query)
        .select("userId fullName email phoneNumber address")
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

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

//✅ get available products
const availableProducts = async (req, res) => {
  try {
    const { branchId } = req.params;
    let { page = 1, limit = 10 } = req.query;

    // Ensure pagination is a number
    page = parseInt(page);
    limit = parseInt(limit);

    const [totalCount, data] = await Promise.all([
      // Count total number of products in the given branch
      BranchAdminProductModel.countDocuments({
        branch: branchId,
      }),

      // Pagination logic: Skip and limit applied
      BranchAdminProductModel.find({ branch: branchId })
        .skip((page - 1) * limit)
        .limit(limit)
        .select("product quantity")
        .populate("product", "productCode brand productName size price"),
    ]);

    // Calculate pagination details
    const totalPages = Math.ceil(totalCount / limit);
    const hasPrevious = page > 1;
    const hasNext = page < totalPages;

    const formattedProducts = data.map((item) => ({
      id: item._id,
      productCode: item.product.productCode,
      brand: item.product.brand,
      productName: item.product.productName,
      size: item.product.size,
      availableQuantity: item.quantity,
      price: item.product.price,
    }));

    res.status(200).json({
      success: true,
      totalPages,
      totalCount,
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

//✅ Add Product Quantity
const addQuantity = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    // Basic validations
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid branch product ID." });
    }

    if (!quantity || typeof quantity !== "number" || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid quantity greater than 0.",
      });
    }

    // Fetch branch product and associated product in one go
    const branchProduct = await BranchAdminProductModel.findById(id).populate({
      path: "product",
      select: "availableProductQuantity",
    });
    if (!branchProduct) {
      return res
        .status(404)
        .json({ success: false, message: "Branch Product Not found" });
    }

    const available = branchProduct.product?.availableProductQuantity ?? 0;

    if (quantity > available) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Only ${available} item(s) available.`,
      });
    }

    // update both quantities
    branchProduct.quantity += quantity;
    branchProduct.product.availableProductQuantity -= quantity;

    // Save both documents in parallel
    await Promise.all([branchProduct.save(), branchProduct.product.save()]);

    return res.status(200).json({
      success: true,
      message: `${quantity} unit(s) added successfully.`,
      updatedBranchQuantity: branchProduct.quantity,
      remainingMainStock: branchProduct.product.availableProductQuantity,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

//✅ Remove product quantity
const removeQuantity = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    // Basic validations
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid branch product ID." });
    }

    if (!quantity || typeof quantity !== "number" || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid quantity greater than 0.",
      });
    }

    // Fetch branch product and associated product in one go
    const branchProduct = await BranchAdminProductModel.findById(id).populate({
      path: "product",
      select: "availableProductQuantity",
    });
    if (!branchProduct) {
      return res
        .status(404)
        .json({ success: false, message: "Branch Product Not found" });
    }

    if (quantity > branchProduct.quantity) {
      return res.status(400).json({
        success: false,
        message: `Cannot remove ${quantity} unit(s). Only ${branchProduct.quantity} available in branch stock.`,
      });
    }

    // Update both branch and main product stock
    branchProduct.quantity -= quantity;
    branchProduct.product.availableProductQuantity += quantity;

    // Save both documents in parallel
    await Promise.all([branchProduct.save(), branchProduct.product.save()]);

    return res.status(200).json({
      success: true,
      message: `${quantity} unit(s) removed successfully.`,
      updatedBranchQuantity: branchProduct.quantity,
      remainingMainStock: branchProduct.product.availableProductQuantity,
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
  addQuantity,
  removeQuantity,
};
