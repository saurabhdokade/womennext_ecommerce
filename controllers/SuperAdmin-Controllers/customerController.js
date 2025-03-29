const userModel = require("../../models/UserModels/User");
const mongoose = require("mongoose");
 
const getAllCustomers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = "" } = req.query;
        const currentPage = parseInt(page);
        const pageLimit = parseInt(limit);
 
        let query = {};
 
        if (search) {
            query = {
                $or: [
                    { fullName: { $regex: search, $options: "i" } },
                    { email: { $regex: search, $options: "i" } },
                    { phoneNumber: isNaN(search) ? null : Number(search) }, // Exact match
                ],
            };
        }
 
        const totalCustomers = await userModel.countDocuments(query);
        const totalPages = Math.ceil(totalCustomers / pageLimit);
        const hasPrevious = currentPage > 1;
        const hasNext = currentPage < totalPages;
 
        const customers = await userModel
            .find(query)
            .select("-otp -otpExpiresAt")
            .skip((currentPage - 1) * pageLimit)
            .limit(pageLimit)
            .sort({ createdAt: -1 });
 
        return res.status(200).json({
            success: true,
            totalCustomers,
            totalPages,
            currentPage,
            previous: hasPrevious,
            next: hasNext,
            customers,
        });
    } catch (error) {
        console.log(error);
      return  res.status(500).json({ success: false, message: error.message });
    }
};
 
 
const getCustomerById = async (req, res) => {
    try {
        const { id } = req.params;
 
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid customer ID." });
        }
 
        const customer = await userModel.findById(id);
        if (!customer) {
            return res
                .status(404)
                .json({ success: false, message: "Customer not found" });
        }
 
       return  res.status(200).json({ success: true, fullName: customer.fullName, phoneNumber: customer.phoneNumber, gender: customer.gender, email: customer.email, address: customer.address, image: customer.image });
    } catch (error) {
        console.log(error);
       return  res.status(500).json({ success: false, message: error.message });
    }
};
 
const updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
 
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid customer ID." });
        }
 
        const { fullName, phoneNumber, gender, email, address } =
            req.body;
        const image = req.file?.path;
 
        const customer = await userModel
            .findById(id)
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

const deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;
 
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid customer ID." });
        }
 
        const customer = await userModel.findByIdAndDelete(id);
        if (!customer) {
            return res
                .status(404)
                .json({ success: false, message: "Customer not found" });
        }
 
        res.status(200).json({ success: true, message: "Customer deleted successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};
 


 
 
module.exports = { getAllCustomers, getCustomerById, updateCustomer, deleteCustomer };
 
 