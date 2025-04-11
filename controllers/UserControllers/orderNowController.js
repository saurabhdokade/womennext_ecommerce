const Order = require("../../models/UserModels/orderNow");
const DeliveryBoyModel = require("../../models/SuperAdminModels/DeliveryBoy");
const mongoose = require("mongoose");

//✅ Get Order by ID
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
      order,
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

    return res.status(200).json({
      message: "Order confirmed successfully",
      order,
    });
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//✅ Delivered Order
const deliveredOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    // Step 1: Find the order with populated fields
    const order = await Order.findById(orderId)
      .populate("deliveryBoy", "fullName email address phoneNumber image")
      .populate("items.product", "productName price");

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (order.status === "Delivered") {
      return res.status(400).json({ message: "Order is already delivered." });
    }

    order.status = "Delivered";
    //Removed tracking from base order object
    const responseOrder = order.toObject();
    delete responseOrder.deliveryBoy;

    await order.save();
    // Step 4: Get previous delivered orders of this delivery boy
    let formattedPreviousOrders = [];
    if (order.deliveryBoy && order.deliveryBoy._id) {
      const previousOrders = await Order.find({
        deliveryBoy: order.deliveryBoy._id,
        status: "Delivered",
        _id: { $ne: order._id },
      })
        .populate("items.product", "productName price")
        .select("orderDate items totalAmount deliveryAddress");

      formattedPreviousOrders = previousOrders.map((ord) => ({
        orderDate: ord.orderDate,
        deliveryAddress: ord.deliveryAddress,
        totalAmount: ord.totalAmount,
        items: ord.items.map((item) => ({
          productName: item.product?.productName || "N/A",
          quantity: item.quantity,
          price: item.price,
        })),
      }));
    }

    // Step 5: Final merged response
    return res.status(200).json({
      message: "Order delivered successfully",
      order: responseOrder,
      // deliveryBoy: order.deliveryBoy ? {
      //   fullName: order.deliveryBoy.fullName,
      //   email: order.deliveryBoy.email,
      //   address: order.deliveryBoy.address,
      //   phoneNumber: order.deliveryBoy.phoneNumber,
      //   image: order.deliveryBoy.image
      // } : null,
      // previousOrders: formattedPreviousOrders
    });
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//✅ Ongoing Placed
const orderPlaced = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (order.status === "Order Placed") {
      return res.status(400).json({ message: "Order is already Placed." });
    }

    order.status = "Order Placed";
    await order.save();

    return res.status(200).json({
      message: "Your Order Placed Successfully",
      order,
    });
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
 

//✅ Packed The product
const packedOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const order = await Order.findById(orderId);

    if (!order) return res.status(404).json({ message: "Order not found." });

    if (order.status === "Packed the Product")
      return res.status(400).json({ message: "Order is already packed." });



    // ✅ Update order status
    order.status = "Packed the Product";

    await order.save();

    return res.status(200).json({
      message: "Order packed successfully",
      order,
    });
  } catch (error) {
    console.error("Server Error:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

//✅ Arrived in the Warehouse
const arrivedInWarehouse = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (order.status === "Arrived in the Warehouse") {
      return res
        .status(400)
        .json({ message: "Order is already arrived in the warehouse." });
    }

    const arrivedDate = order.statusTimeline.arrivedAtWarehouse;

    if (!arrivedDate) {
      return res
        .status(400)
        .json({ message: "Order is not yet arrived in the warehouse." });
    }

    order.status = "Arrived in the Warehouse";

    await order.save();

    return res.status(200).json({
      message: "Order arrived in the warehouse successfully",
      order,
    });
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//✅ Nearby Courier Facility
const nearByCourierFacility = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (order.status === "Nearby Courier Facility") {
      return res
        .status(400)
        .json({ message: "Order is already at Nearby courier facility." });
    }

    order.status = "Nearby Courier Facility";

    await order.save();

    return res.status(200).json({
      message: "Order ready by courier facility successfully",
      order,
    });
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//✅ Out for Delivery
const outForDelivery = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (order.status === "Out for Delivery") {
      return res
        .status(400)
        .json({ message: "Order is already out for delivery." });
    }

    const outForDeliveryDate = order.statusTimeline.outForDelivery;

    if (!outForDeliveryDate) {
      return res
        .status(400)
        .json({ message: "Order is not yet out for delivery." });
    }

    order.status = "Out for Delivery";

    await order.save();

    return res.status(200).json({
      message: "Order out for delivery successfully",
      order,
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

    if (order.status === "Cancelled") {
      return res.status(400).json({ message: "Order is already cancelled." });
    }

    order.status = "Cancelled";
    order.cancelReason = cancelReason;
    order.otherReason = cancelReason === "Other" ? otherReason : N / A;

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
      delete orderObj.tracking;
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
      (order) => order.status === "Ongoing"
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

//✅ Get Order Details
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
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

module.exports = {
  getOrderById,
  confirmOrder,
  deliveredOrder,
  orderPlaced,
  packedOrder,
  arrivedInWarehouse,
  nearByCourierFacility,
  outForDelivery,
  cancelOrder,
  getUserOrders,
  getViewOrderDetails,
};
