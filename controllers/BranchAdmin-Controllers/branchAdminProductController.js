const ProductModel = require("../../models/SuperAdminModels/Product");
const mongoose = require("mongoose");
 
// Get all products with pagination
const getAllProducts = async (req, res) => {
    try {
        let { page = 1, limit = 10, search = "" } = req.query; // Default: page 1, limit 10, empty search query
        page = parseInt(page);
        limit = parseInt(limit);
 
        // Create a search filter
        const searchFilter = {
            $or: [
                { brand: { $regex: search, $options: "i" } },
                { productName: { $regex: search, $options: "i" } },
                { productSubType: { $regex: search, $options: "i" } },
            ],
        };
 
        const totalProducts = await ProductModel.countDocuments(searchFilter);
        const products = await ProductModel.find(searchFilter)
            .skip((page - 1) * limit)
            .limit(limit);
 
        const totalPages = Math.ceil(totalProducts / limit);
        const hasPrevious = page > 1;
        const hasNext = page < totalPages;
 
        res.status(200).json({
            success: true,
            totalProducts,
            totalPages,
            currentPage: page,
            previous: hasPrevious,
            next: hasNext,
            products,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
 
// Get a single product by ID
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
 
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid product ID." });
        }
 
        const product = await ProductModel.findById(id);
        if (!product) {
            return res
                .status(404)
                .json({ success: false, message: "Product not found" });
        }
        res.status(200).json({ success: true, product });
    } catch (error) {
        console.log(error);
        res
            .status(500)
            .json({ success: false, message: "Error fetching product", error });
    }
};
 
module.exports = { getAllProducts, getProductById };
 
 