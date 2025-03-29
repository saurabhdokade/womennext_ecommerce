const DeliveryBoyModel = require("../../models/SuperAdminModels/DeliveryBoy");
const mongoose = require("mongoose");
 
const getAllDeliveryBoys = async (req, res) => {
    try {
        let { page = 1, limit = 10, search = "", sortOrder } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
 
        // Determine sorting order (default to no sorting if sortOrder is not provided)
        let sortOption = {};
        if (sortOrder === "asc" || sortOrder === "desc") {
            sortOption.fullName = sortOrder === "desc" ? -1 : 1;
        }
 
        // Create a search filter
        const searchFilter = {
            $or: [
                { fullName: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { userId: { $regex: search, $options: "i" } },
            ],
        };
 
        const totalDeliveryBoys = await DeliveryBoyModel.countDocuments(
            searchFilter
        );
        const deliveryBoys = await DeliveryBoyModel.find(searchFilter)
            .sort(sortOption) // Apply sorting only if provided
            .skip((page - 1) * limit)
            .limit(limit);
 
        const totalPages = Math.ceil(totalDeliveryBoys / limit);
        const hasPrevious = page > 1;
        const hasNext = page < totalPages;
 
        res.status(200).json({
            success: true,
            totalDeliveryBoys,
            totalPages,
            currentPage: page,
            previous: hasPrevious,
            next: hasNext,
            deliveryBoys,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
 
const getDeliveryBoyById = async (req, res) => {
    try {
        const { id } = req.params;
 
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid delivery boy ID." });
        }
 
        const deliveryBoy = await DeliveryBoyModel.findById(id);
 
        if (!deliveryBoy) {
            return res
                .status(404)
                .json({ success: false, message: "Delivery boy not found." });
        }
 
        res.status(200).json({ success: true, deliveryBoy });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
 
module.exports = { getAllDeliveryBoys, getDeliveryBoyById };