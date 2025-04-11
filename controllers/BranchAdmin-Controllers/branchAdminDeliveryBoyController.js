const DeliveryBoyModel = require("../../models/SuperAdminModels/DeliveryBoy");
const Order = require("../../models/UserModels/orderNow");
const mongoose = require("mongoose");
 
//✅ Get All Delivery Boys
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
            .select("image fullName phoneNumber userId")
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
 
//✅ Get Delivery Boy By ID
const getDeliveryBoyById = async (req, res) => {
    try {
      const { id } = req.params;
  
      // Step 1: Validate MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid delivery boy ID.",
        });
      }
  
      // Step 2: Fetch Delivery Boy Details
      const deliveryBoy = await DeliveryBoyModel.findById(id).select(
        "image fullName gender address phoneNumber email"
      );
  
      if (!deliveryBoy) {
        return res.status(404).json({
          success: false,
          message: "Delivery boy not found.",
        });
      }

  
     
      const previousOrder = await Order.find({ 
        deliveryBoy: id,
        status: "Delivered",
       })
        .sort({ createdAt: -1 })
        .limit(3)
        .populate({
          path: "items.product",
          model: "Products",
          select: "productName",
        });
  
      // Step 4: Format Order Details
      const formattedOrders = [];
  
      previousOrder.forEach((order) => {
        const orderDate = new Date(order.orderDate).toLocaleDateString("en-IN");
  
        const deliveryAddress = [
          order.deliveryAddress?.name,
          order.deliveryAddress?.street,
          order.deliveryAddress?.city,
          order.deliveryAddress?.zipCode,
        ]
          .filter(Boolean)
          .join(", ");
  
        order.items.forEach((item) => {
          formattedOrders.push({
            id: order._id,
            Date: orderDate,
            productName: item.product?.productName || "Unknown Product",
            quantity: item.quantity,
            price: item.price,
            totalPrice: item.quantity * item.price,
            status: order.status,
            deliveryAddress,
          });
        });
      });
  
   
      return res.status(200).json({
        success: true,
        deliveryBoy,
        previousDeliveryDetails: formattedOrders,
      });
    } catch (error) {
      console.error("Error fetching delivery boy details:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: error.message,
      });
    }
  };
  



//✅ Get Order Details By Delivery Boy ID
const getOrderDetailsByDeliveryBoyId = async (req, res) => {
  try {
      const { id } = req.params;
      let { page = 1, limit = 10, fromDate, toDate } = req.query;

      page = parseInt(page);
      limit = parseInt(limit);

      if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({ success: false, message: "Invalid delivery boy ID." });
      }

      // Build filter object
      const filter = { deliveryBoy: id };
      if (fromDate && toDate) {
          const parsedFromDate = parseDate(fromDate);
          const parsedToDate = parseDate(toDate);
          filter.orderDate = {
              $gte: parsedFromDate,
              $lte: new Date(parsedToDate.setHours(23, 59, 59, 999))
          };
      }

      // Total orders count
      const totalOrders = await Order.countDocuments(filter);

      // Fetch orders with pagination
      const orders = await Order.find(filter)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .populate({
              path: "items.product",
              model: "Products",
              select: "productName"
          });

      // Flatten and format response
      const formattedOrders = [];

      orders.forEach(order => {
          const orderDate = new Date(order.orderDate).toLocaleDateString('en-IN');

          const deliveryAddress = [
              order.deliveryAddress?.name,
              order.deliveryAddress?.street,
              order.deliveryAddress?.city,
              order.deliveryAddress?.zipCode
          ].filter(Boolean).join(', ');

          order.items.forEach(item => {
              formattedOrders.push({
                  Date: orderDate,
                  productName: item.product?.productName || "Unknown Product",
                  quantity: item.quantity,
                  price: item.price,
                  totalPrice: item.quantity * item.price,
                  deliveryAddress: deliveryAddress
              });
          });
      });

      const totalPages = Math.ceil(totalOrders / limit);
      const hasPrevious = page > 1;
      const hasNext = page < totalPages;

      return res.status(200).json({
          success: true,
          totalPages,
          currentPage: page,
          previous: hasPrevious,
          next: hasNext,
          orders: formattedOrders
      });

  } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: error.message });
  }
};
  
//✅ DropDown Api's For Delivery Boy
const getDeliveryBoyDropdown = async (req, res) => {
  try {
    const deliveryBoys = await DeliveryBoyModel.find().select("fullName -_id");

    const names = deliveryBoys.map((boy) => boy.fullName);

    return res.status(200).json({
      success: true,
      deliveryBoys: names,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch delivery boy dropdown",
      error: error.message,
    });
  }
};

module.exports = { getAllDeliveryBoys, getDeliveryBoyById, getOrderDetailsByDeliveryBoyId, getDeliveryBoyDropdown };