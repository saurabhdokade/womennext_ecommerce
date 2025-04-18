const userModel = require("../../models/UserModels/User");
const Order = require("../../models/UserModels/orderNow");
const mongoose = require("mongoose");

//✅ Get All Customers
const getAllCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", branch } = req.query;
    const currentPage = parseInt(page);
    const pageLimit = parseInt(limit);

    let query = {};
    query.isVerified = true;

    // Handle search parameters
    if (search) {
      query = {
        $or: [
          { fullName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phoneNumber: isNaN(search) ? null : Number(search) },
        ],
      };
    }

    // Fetch branch pincode if branch is provided
    if (branch) {
      const branchInfo = await branchModel.findById(branch).select("servicePinCode");
      const servicePincodes = branchInfo?.servicePinCode || [];

      // If servicePincodes is empty, return empty data
      if (servicePincodes.length === 0) {
        return res.status(200).json({
          success: true,
          totalCustomers: 0,
          totalPages: 0,
          currentPage,
          previous: false,
          next: false,
          customers: [],
        });
      }

      // Add pincode filter
      query.address = { $regex: servicePincodes.join("|"), $options: "i" };
    }

    // Aggregate query
    const customers = await userModel.aggregate([
      { $match: query },
      { $sort: { createdAt: -1 } },
      { $skip: (currentPage - 1) * pageLimit },
      { $limit: pageLimit },
      {
        $project: {
          _id: 1,
          fullName: 1,
          image: 1,
          phoneNumber: 1,
          address: 1,
        },
      },
    ]);

    const totalCustomers = await userModel.countDocuments(query);
    const totalPages = Math.ceil(totalCustomers / pageLimit);

    const formattedCustomers = customers.map((customer) => ({
      _id: customer._id,
      fullName: {
        image: customer.image,
        name: customer.fullName,
      },
      phoneNumber: customer.phoneNumber,
      fullAddress: customer.address,
    }));

    return res.status(200).json({
      success: true,
      totalCustomers,
      totalPages,
      currentPage,
      previous: currentPage > 1,
      next: currentPage < totalPages,
      customers: formattedCustomers,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
 
 

//✅ Get Customer by ID
const getCustomerById = async (req, res) => {
  try {
    const { userId } = req.params;
    //   console.log("Incoming ID:", userId);

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid customer ID." });
    }

    const customer = await userModel.findById(userId);
    if (!customer) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    }

    const orders = await Order.find({
      user: userId,
      status: "Delivered",
    }).populate("items.product");

    const formattedProducts = orders.flatMap((order) =>
      order.items.map((item) => ({
        date: new Date(order.orderDate).toLocaleDateString("en-IN"),
        productName: item.product?.productName || "N/A",
        Quantity: item.quantity,
        price: item.price,
        totalPrice: item.quantity * item.price,
        // orderStatus: order.status
      }))
    );

    return res.status(200).json({
      success: true,
      customerDetails: {
        image: customer.image,
        fullName: customer.fullName,
        phoneNumber: customer.phoneNumber,
        gender: customer.gender,
        fullAddress: customer.address,
      },
      previousOrderDetails: formattedProducts,
    });
  } catch (error) {
    console.log("Error in getCustomerById:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

//✅ Update Customer
const updateCustomer = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid customer ID." });
    }

    const { fullName, phoneNumber, gender, email, address } = req.body;
    const image = req.file?.path;

    const customer = await userModel
      .findById(userId)
      .select("-otp -otpExpiresAt");
    if (!customer) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (fullName) customer.fullName = fullName;
    if (phoneNumber) customer.phoneNumber = phoneNumber;
    if (gender) customer.gender = gender;
    if (email) customer.email = email;
    if (address) customer.address = address;
    if (image) customer.image = image;

    await customer.save();
    return res.status(200).json({
      success: true,
      message: "Customer updated successfully!",
      customer,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

//✅ Delete Customer
const deleteCustomer = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid customer ID." });
    }

    const customer = await userModel.findByIdAndDelete(userId);
    if (!customer) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Customer deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

//✅ DropDown Api For Genders
const getAllGenders = async (req, res) => {
  try {
    const genders = ["Male", "Female", "Others"];
    return res.status(200).json({ success: true, genders });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  getAllGenders,
};
