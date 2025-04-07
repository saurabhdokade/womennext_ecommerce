const Order = require("../../models/UserModels/orderNow");
const mongoose = require("mongoose");

 
// Get Order by ID
 
const getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.id; 
 
        const order = await Order.findOne({ _id: orderId, user: userId })
            .populate("items.product", "name price imageUrl") 
            .populate("user", "name email");
 
        if (!order) {
            return res.status(404).json({ message: "Order not found." });
        }
 
        return res.status(200).json({
            message: "Order details retrieved successfully",
            order
        });
 
    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
  
  
 
// Confirm Order
const confirmOrder = async (req, res) => {
    try {
        const orderId = req.params.orderId;
 
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found." });
        }
 
        if (order.status === "Confirmed") {
            return res.status(400).json({ message: "Order is already confirmed." });
        }
 
        order.status = "Confirmed";
        await order.save();
 
        return res.status(200).json({
            message: "Order confirmed successfully",
            order: order
        });
 
    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

//Delivered Order
const deliveredOrder = async (req, res) => {
    try {
        const orderId = req.params.orderId;
 
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found." });
        }
 
        if (order.status === "Delivered") {
            return res.status(400).json({ message: "Order is already delivered." });
        }
 
        order.status = "Delivered";
        await order.save();
 
        return res.status(200).json({
            message: "Order delivered successfully",
            order: order
        });
 
    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

//Ongoing Order
const ongoingOrder = async (req, res) => {
    try {
        const orderId = req.params.orderId;
 
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found." });
        }
 
        if (order.status === "Ongoing") {
            return res.status(400).json({ message: "Order is already ongoing." });
        }
 
        order.status = "Ongoing";
        await order.save();
 
        return res.status(200).json({
            message: "Order ongoing successfully",
            order: order
        });
 
    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Cancel Order
const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { cancelReason, otherReason } = req.body; 
 
        const validReasons = [
            "I want to change the Product",
            "Not available on the delivery time",
            "Price High",
            "I ordered wrong Product",
            "Other"
        ];
 
        if (!validReasons.includes(cancelReason)) {
            return res.status(400).json({ message: "Invalid cancellation reason." });
        }
 
        if (cancelReason === "Other" && (!otherReason || otherReason.trim() === "")) {
            return res.status(400).json({ message: "Please provide a reason for cancellation." });
        }
 
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found." });
        }
 
        if (order.status === "Cancelled") {
            return res.status(400).json({ message: "Order is already cancelled." });
        }
 
        order.status = "Cancelled";
        order.cancelReason = cancelReason;
        order.otherReason = cancelReason === "Other" ? otherReason : null;
 
        await order.save();
 
        return res.status(200).json({
            message: "Order cancelled successfully",
            order: order
        });
 
    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Get User Orders
const getUserOrders = async (req, res) => {
    try {
      const userId = req.user.id;
  
      const orders = await Order.find({ user: userId }).populate("items.product");
  
      if (!orders || orders.length === 0) {
        return res.status(404).json({ message: "No orders found." });
      }
  
      // Categorize orders
      const confirmedOrders = orders.filter((order) => order.status === "Confirmed");
      const deliveredOrders = orders.filter((order) => order.status === "Delivered");
      const ongoingOrders = orders.filter((order) => order.status === "Ongoing");
      const cancelledOrders = orders.filter((order) => order.status === "Cancelled");
  
      res.status(200).json({
        success: true,
        orders: {
          confirmed: confirmedOrders,
          delivered: deliveredOrders,
          ongoing: ongoingOrders,
          cancelled: cancelledOrders,
        },
      });
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };
 
// Get Order Details
const getViewOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: "Invalid order ID." });
    }

    const order = await Order.findById(orderId)
      .populate({
        path: "items.product",
        select: "productName image",
      })
      .populate("user", "fullName address");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    res.status(200).json({
      success: true,
      order: {
        id: order._id,
        items: order.items.map((item) => ({
          productName: item.product?.productName || "Product Name Missing",
          productImage: item.product?.image?.[0] || "No Image Available",
          quantity: item.quantity,
          price: item.price,
        })),
        orderPlacedOn: order.orderDate,
        orderDeliveredOn: order.deliveryDate || "Pending",
        orderNumber: order._id,
        shippingAddress: order.user?.address || "N/A",
        paymentMethod: order.paymentMethod || "Cash on Delivery",
        orderSummary: {
          price: order.totalAmount,
          discount: 0,
          coupons: 0,
          deliveryCharges: order.deliveryCharges || 0,
          tax: 0,
          totalAmount: order.totalAmount,
        },
        status: order.status,
      },
    });
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};


  module.exports = {
   getOrderById,
    confirmOrder,
    cancelOrder,
    getUserOrders,
    getViewOrderDetails,
    deliveredOrder,
    ongoingOrder,
    
  }