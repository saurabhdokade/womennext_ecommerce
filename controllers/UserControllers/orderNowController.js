const Order = require("../../models/UserModels/orderNow");

const mongoose = require("mongoose");

//✅ Get Order Details by ID
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

    // Convert Mongoose document to plain object & remove unwanted fields
    const {
      otherReason,
      cancelledBy,
      cancelDate,
      ...filteredOrder
    } = order.toObject();

    return res.status(200).json({
      message: "Order details retrieved successfully",
      order: filteredOrder,
    });
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//✅ Confirm Order
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

    const {
      otherReason,
      cancelledBy,
      cancelDate,
      ...filteredOrder
    } = order.toObject();

    const formattedOrderDate = new Date(order.orderDate).toLocaleDateString('en-GB');
    return res.status(200).json({
      message: "Order confirmed successfully",
      order:{
        ...filteredOrder,
        orderDate: formattedOrderDate,
      },
    });
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
  

//✅ Cancel Order
const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { cancelReason, otherReason } = req.body;

    const validReasons = [
      "I want to change the Product",
      "Not available on the delivery time",
      "Price High",
      "I ordered wrong Product",
      "Other",
    ];

    if (!validReasons.includes(cancelReason)) {
      return res.status(400).json({ message: "Invalid cancellation reason." });
    }

    if (
      cancelReason === "Other" &&
      (!otherReason || otherReason.trim() === "")
    ) {
      return res
        .status(400)
        .json({ message: "Please provide a reason for cancellation." });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (order.status === "OrderCancelled") {
      return res.status(400).json({ message: "Order is already cancelled." });
    }

    order.status = "OrderCancelled";
    order.deliveryStatus = "Cancelled"; // <- Add this line
    order.cancelReason = cancelReason;
    order.otherReason = cancelReason === "Other" ? otherReason : "N/A";

    await order.save({ timestamps: false });

    return res.status(200).json({
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


//✅ Get User Orders
const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await Order.find({ user: userId }).populate("items.product");

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "No orders found." });
    }

    // Remove tracking from all orders
    const sanitizedOrders = orders.map((order) => {
      const orderObj = order.toObject();
      // Remove null fields
      if (orderObj.otherReason === null) delete orderObj.otherReason;
      if (orderObj.cancelledBy === null) delete orderObj.cancelledBy;
      if (orderObj.cancelDate === null) delete orderObj.cancelDate;
      return orderObj;
    });

    // Categorize orders
    const confirmedOrders = sanitizedOrders.filter(
      (order) => order.status === "Confirmed"
    );
    const deliveredOrders = sanitizedOrders.filter(
      (order) => order.status === "Delivered"
    );
    const ongoingOrders = sanitizedOrders.filter(
      (order) => order.status === "In "
    );
    const cancelledOrders = sanitizedOrders.filter(
      (order) => order.status === "Cancelled"
    );

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

//✅ Get View Order Details
const getViewOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid order ID." });
    }

    const order = await Order.findById(orderId)
      .select("-tracking")
      .populate({
        path: "items.product",
        select: "productName image",
      })
      .populate("user", "fullName address");

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found." });
    }

    return res.status(200).json({
      message: "View Order Details reterived successfully",
      success: true,
      order: {
        id: order._id,
        items: order.items.map((item) => ({
          productName: item.product?.productName || "Product Name Missing",
          productImage: item.product?.image?.[0] || "No Image Available",
          quantity: item.quantity,
          price: item.price,
        })),
        orderPlacedOn: new Date(order.orderDate).toLocaleDateString('en-GB'),
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
      },
    });
  } catch (error) {
    console.error("Error fetching order details:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};


//✅ trackOrder function
// Utility function to format date and time
const formatDateTime = (date) => {
  const optionsDate = {
    day: "2-digit",
    month: "short",
    year: "numeric",
  };
 
  const optionsTime = {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };
 
  return {
    date: new Date(date).toLocaleDateString("en-GB", optionsDate), 
    time: new Date(date).toLocaleTimeString("en-GB", optionsTime), 
  };
};

const trackOrder = async (req, res) => {
  try {
    const { id } = req.params;
 
    const order = await Order.findById(id)
      .populate("items.product")
      .populate("user");
 
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
 
    // Timeline generation
    const timeline = [];
 
    // 1. Order Placed
    const placed = formatDateTime(order.createdAt);
    timeline.push({
      status: "Order Placed",
      date: placed.date,
      time: placed.time,
    });
 
    // 2. Out For Delivery (includes the assignment to delivery boy)
    if (order.outForDeliveryAt) {
      const outForDelivery = formatDateTime(order.outForDeliveryAt || order.updatedAt);
      timeline.push({
        status: "Out For Delivery",
        date: outForDelivery.date,
        time: outForDelivery.time,
      });
    }
 
    // 3. Delivered
    if (order.deliveryStatus === "Delivered") {
      const delivered = formatDateTime(order.deliveredAt || order.updatedAt);
      timeline.push({
        status: "Delivered",
        date: delivered.date,
        time: delivered.time,
      });
    }
 
    return res.status(200).json({
      orderId: order.orderId,
      productImage: order.items[0]?.product?.image?.[0] || "",
      productName: order.items[0]?.product?.productName || order.items[0]?.product?.name || "Product Name",
      quantity: order.items[0]?.quantity || 1,
      totalPrice: order.totalAmount,
      deliveryStatus: order.deliveryStatus,
      timeline,
    });
 
  } catch (err) {
    console.error("Error in trackOrder:", err);
    res.status(500).json({ message: "Server error" });
  }
};
module.exports = {
  getOrderById,
  confirmOrder,
  cancelOrder,
  getUserOrders,
  getViewOrderDetails,
  trackOrder,
};
