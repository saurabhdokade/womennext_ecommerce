const Order = require("../../models/UserModels/orderNow");
const DeliveryBoyModel = require("../../models/SuperAdminModels/DeliveryBoy");
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
      order,
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

    const now = new Date()
    order.status = "Confirmed";
    order.statusTimeline.orderConfirmed = now;
    order.tracking.push({
      status: "Confirmed",
      date: order.statusTimeline.orderConfirmed,
    });
    await order.save({timestamps:false});

    const responseOrder = order.toObject();
    delete responseOrder.tracking;

    return res.status(200).json({
      message: "Order confirmed successfully",
      order: responseOrder,
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

    //  Get the delivered date from statusTimeline
    const deliveredDate = order.statusTimeline.delivered;

    if(!deliveredDate) {
      return res.status(400).json({ message: "Order is not yet delivered." });
    }
  
    order.status = "Delivered";

    //  Check if the order has already been tracked
    const alreadyTracked = order.tracking.some(t => t.status === "Delivered");
    if (!alreadyTracked) {
      order.tracking.push({
        status: "Delivered",
        date: deliveredDate
      });
    }
    
    //Removed tracking from base order object
    const responseOrder = order.toObject();
    delete responseOrder.tracking;
    delete responseOrder.deliveryBoy;

    await order.save({ timestamps: false });
    // Step 4: Get previous delivered orders of this delivery boy
    let formattedPreviousOrders = [];
    if (order.deliveryBoy && order.deliveryBoy._id) {
      const previousOrders = await Order.find({
        deliveryBoy: order.deliveryBoy._id,
        status: "Delivered",
        _id: { $ne: order._id }
      })
        .populate("items.product", "productName price")
        .select("orderDate items totalAmount deliveryAddress");

      formattedPreviousOrders = previousOrders.map(ord => ({
        orderDate: ord.orderDate,
        deliveryAddress: ord.deliveryAddress,
        totalAmount: ord.totalAmount,
        items: ord.items.map(item => ({
          productName: item.product?.productName || "N/A",
          quantity: item.quantity,
          price: item.price,
        }))
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

//Ongoing Order
const ongoingOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (order.status === "In Process") {
      return res.status(400).json({ message: "Order is already In process." });
    }

    order.status = "In Process";
    await order.save({ timestamps: false });

    // ✅ Remove tracking from response
    const responseOrder = order.toObject();
    delete responseOrder.tracking;

    return res.status(200).json({
      message: "Order is Currently In Process....",
      order: responseOrder,
    });
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//packed The product
const packedOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const order = await Order.findById(orderId);

    if (!order)
      return res.status(404).json({ message: "Order not found." });

    if (order.status === "Packed the Product")
      return res.status(400).json({ message: "Order is already packed." });

    // ✅ Set packed date in statusTimeline
    const packedDate = new Date();
    order.statusTimeline.packed = packedDate;

    // ✅ Update order status
    order.status = "Packed the Product";

    // ✅ Push to tracking only if not already there
    const alreadyTracked = order.tracking.some(
      (t) => t.status === "Packed the Product"
    );

    if (!alreadyTracked) {
      order.tracking.push({
        status: "Packed the Product",
        date: packedDate
      });
    }

    console.log("Before Save => Status:", order.status);
    await order.save({ timestamps: false });
    console.log("After Save => Status:", order.status);

//     console.log("Order ID:", order._id);
// console.log("Current Status:", order.status);

    const responseOrder = order.toObject();
    delete responseOrder.tracking;

    return res.status(200).json({
      message: "Order packed successfully",
      order: responseOrder
    });

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};


//Arrived in the Warehouse
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

    if(!arrivedDate) {
      return res.status(400).json({ message: "Order is not yet arrived in the warehouse." });
    }
  
    order.status = "Arrived in the Warehouse";

    //  Check if the order has already been tracked
    const alreadyTracked = order.tracking.some(t => t.status === "Arrived in the Warehouse");
    if (!alreadyTracked) {
      order.tracking.push({
        status: "Arrived in the Warehouse",
        date: arrivedDate
      });
    }
    await order.save({ timestamps: false });
    
    // ✅ Remove tracking from response
    const responseOrder = order.toObject();
    delete responseOrder.tracking;

  

    return res.status(200).json({
      message: "Order arrived in the warehouse successfully",
      order: responseOrder,
    });
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//Nearby Courier Facility
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

    const courierDate = order.statusTimeline.nearCourierFacility;

    if(!courierDate) {
      return res.status(400).json({ message: "Order is not yet Nearby courier facility." });
    }
  
    order.status = "Nearby Courier Facility";

    //  Check if the order has already been tracked
    const alreadyTracked = order.tracking.some(t => t.status === "Nearby Courier Facility");
    if (!alreadyTracked) {
      order.tracking.push({
        status: "Nearby Courier Facility",
        date: courierDate
      });
    }
    await order.save({ timestamps: false });
    // ✅ Remove tracking from response
    const responseOrder = order.toObject();
    delete responseOrder.tracking;

    await order.save();

    return res.status(200).json({
      message: "Order ready by courier facility successfully",
      order: responseOrder,
    });
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


//Out for Delivery
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

    if(!outForDeliveryDate) {
      return res.status(400).json({ message: "Order is not yet out for delivery." });
    }
  
    order.status = "Out for Delivery";

    //  Check if the order has already been tracked
    const alreadyTracked = order.tracking.some(t => t.status === "Out for Delivery");
    if (!alreadyTracked) {
      order.tracking.push({
        status: "Out for Delivery",
        date: outForDeliveryDate
      });
    }
    await order.save({ timestamps: false });
  
    // ✅ Remove tracking from response
    const responseOrder = order.toObject();
    delete responseOrder.tracking;

   

    return res.status(200).json({
      message: "Order out for delivery successfully",
      order: responseOrder,
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
    order.otherReason = cancelReason === "Other" ? otherReason : null;

    await order.save({ timestamps: false });

    // Removed tracking from response
    const responseOrder = order.toObject();
    delete responseOrder.tracking;

    return res.status(200).json({
      message: "Order cancelled successfully",
      order: responseOrder,
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

    // Remove tracking from all orders
    const sanitizedOrders = orders.map(order => {
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
    const ongoingOrders = sanitizedOrders.filter((order) => order.status === "Ongoing");
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

// Get Order Details
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
  ongoingOrder,
  packedOrder,
  arrivedInWarehouse,
  nearByCourierFacility,
  outForDelivery,
  cancelOrder,
  getUserOrders,
  getViewOrderDetails,
};
