const ProductModel = require("../../models/SuperAdminModels/Product");
const mongoose = require("mongoose");
 
//✅ Get all products with pagination
const getAllProducts = async (req, res) => {
    try {
        let { page = 1, limit = 10, search = "" } = req.query;

        // Ensure page and limit are positive integers
        page = Math.max(1, parseInt(page));
        limit = Math.max(1, parseInt(limit));
        search = search.trim();

        // Search filter using regex
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
            .limit(limit)
            .select("image productName brand availableProductQuantity") // Fetch only needed fields
            .lean();

        const totalPages = Math.ceil(totalProducts / limit);

        const formattedProducts = products.map((product) => ({
            id: product._id,
            image: product.image?.[0] || null,
            productName: product.productName,
            brand: product.brand,
            availableProductQuantity: product.availableProductQuantity,
        }));

        res.status(200).json({
            success: true,
            pagination: {
                totalProducts,
                totalPages,
                currentPage: page,
                hasPreviousPage: page > 1,
                hasNextPage: page < totalPages,
            },
            products: formattedProducts,
        });
    } catch (error) {
        console.error("Error in getAllProducts:", error);
        return res.status(500).json({ success: false, message: "Server error: " + error.message });
    }
};
 
//✅ Get a single product by ID
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

        const formattedProduct = {
            id: product._id,
            ProductName: product.productName,
            image: product.image?.[0] || null,
            BrandName: product.brand, // or product.brand if your schema uses that
            Size: product.size,
            QuantityInEachPack: product.quantityInEachPack, // or product.quantityInEachPack
            ProductCode:product.productCode, // or product.productCode if your schema uses that
            SubType: product.productSubType,
            ProductDescription:product.productDescription
        };

       return res.status(200).json({ success: true, product: formattedProduct });
    } catch (error) {
        console.log(error);
       return  res
            .status(500)
            .json({ success: false, message: "Error fetching product", error });
    }
};

 
module.exports = { getAllProducts, getProductById };
 
 