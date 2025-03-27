const ProductModel = require("../../models/ProductModels/Product");

const createProduct = async (req, res) => {
    try {
        const {
            brand,
            productName,
            productSubType,
            productDescription,
            size,
            price,
            quantityInEachPack,
            availableProductQuantity,
        } = req.body;
 
        let imagePaths = [];
        if (req.files && req.files.length > 0) {
            imagePaths = req.files.map((file) => file.path);
        }
 
        const newProduct = new ProductModel({
            brand,
            productName,
            productSubType,
            productDescription,
            size,
            price,
            quantityInEachPack,
            image: imagePaths,
            availableProductQuantity,
        });
 
        await newProduct.save();
 
        return res.status(201).json({
            success: true,
            message: "Product created successfully",
            product: newProduct,
        });
    } catch (error) {
        console.error("Error creating product:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

//Get All Products
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
 
 
 
 
 

//Get Product by ID
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
 
     
 
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


// ✅ Update Product
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
 
        let imagePaths = [];
        if (req.files && req.files.length > 0) {
            imagePaths = req.files.map((file) => file.path);
        }
 
        const updatedProduct = await ProductModel.findByIdAndUpdate(
            id,
            {
                ...req.body,
                image: imagePaths.length > 0 ? imagePaths : req.body.image,
            },
            { new: true, runValidators: true }
        );
 
        if (!updatedProduct) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }
 
        return res.status(200).json({
            success: true,
            message: "Product updated successfully",
            product: updatedProduct,
        });
    } catch (error) {
        console.error("Error updating product:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

// Delete a product by ID
const deleteProductById = async (req, res) => {
    try {
        const { id } = req.params;
 
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid product ID." });
        }
        const product = await ProductModel.findByIdAndDelete(id);
        if (!product) {
            return res
                .status(404)
                .json({ success: false, message: "Product not found" });
        }
        res
            .status(200)
            .json({ success: true, message: "Product deleted successfully" });
    } catch (error) {
        res
            .status(500)
            .json({ success: false, message: "Error deleting product", error });
    }
};
 
//get unique brands
const getBrands = async (req, res) => {
    try {
        const brands = await ProductModel.distinct("brand");
        res.status(200).json({ success: true, brands });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Fetch unique sizes
const getSizes = async (req, res) => {
    try {
        const sizes = await ProductModel.distinct("size");
        res.status(200).json({ success: true, sizes });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};
module.exports = {createProduct, getAllProducts, getProductById, updateProduct, deleteProductById, getBrands, getSizes}