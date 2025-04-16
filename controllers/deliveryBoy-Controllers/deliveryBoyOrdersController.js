const Order = require("../../models/UserModels/orderNow");


//✅ Accept delivery Boy Order
const acceptOrder = async (req, res) => {
    try {
      // Using req.deliveryBoy to access the delivery boy's details
      const deliveryBoyId = req.deliveryBoy.id;
   
      const { orderId } = req.params; // Assuming orderId is passed as a string
      // console.log("Order ID:", orderId);
   
      // Find the order by orderId (orderId is assumed to be the string identifier)
      const order = await Order.findOne({ orderId: orderId.trim() }); // Using findOne for orderId string
   
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
   
      // Check if the order has already been accepted by a delivery boy
      if (order.deliveryBoy) {
        return res.status(400).json({
          message: "Order already accepted",
          deliveryBoy: order.deliveryBoy,
        });
      }
   
      // Assign the current delivery boy to the order
      order.deliveryBoy = deliveryBoyId;
   
      // Set the delivery status to "Accepted"
      order.deliveryStatus = "Accepted";
   
      // Save the order with updated information
      await order.save();
   
      // Populate the delivery boy information in the response
      await order.populate("deliveryBoy");
   
      res.status(200).json({
        message: "Order accepted successfully",
        order,
      });
    } catch (error) {
      console.error("Accept order error:", error);
      res.status(500).json({ message: "Server error" });
    }
  };
   
//✅ Cancel delivery boy order
   const canceldeliveryBoyOrder = async (req, res) => {
    try {
      const deliveryBoyId = req.deliveryBoy.id.toString(); // Corrected: use _id instead of id
      const { orderId } = req.params;
      const { cancelReason, otherReason } = req.body;
  
      const validReasons = [
        "Vehicle Mechanical Issue",
        "Not Feeling Well",
        "Emergency or Personal Reason",
        "Rescheduling After Sometime",
        "Other",
      ];
  
      if (!validReasons.includes(cancelReason)) {
        return res.status(400).json({ message: "Invalid cancellation reason." });
      }
  
      if (cancelReason === "Other" && (!otherReason || otherReason.trim() === "")) {
        return res.status(400).json({
          message: "Please provide a reason for cancellation.",
        });
      }
  
      const order = await Order.findOne({ orderId: orderId.trim() });
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
  
      if (order.deliveryBoy?.toString() !== deliveryBoyId) {
        return res.status(403).json({
          message: "You are not assigned to this order",
        });
      }
  
      if (order.status === "Cancelled") {
        return res.status(400).json({ message: "Order is already cancelled." });
      }
  
      // Unassign delivery boy and mark order as cancelled
      order.deliveryBoy = null;
      order.deliveryStatus = "In Process"; // Make available for others
      order.status = "Cancelled";
      order.cancelReason = cancelReason;
      order.otherReason = cancelReason === "Other" ? otherReason : "N/A";
  
      await order.save({ timestamps: false });
  
      return res.status(200).json({
        message: "Order cancelled successfully by delivery boy",
        order,
      });
    } catch (error) {
      console.error("Cancel delivery order error:", error);
      return res.status(500).json({ message: "Server error", error: error.message });
    }
  };
   
//✅ Get available orders for delivery boy
   const getAvailableOrders = async (req, res) => {
    try {
      const orders = await Order.find({
        $or: [
          { status: { $regex: /^In Process$/i } },
          { deliveryStatus: { $regex: /^(In Process|Cancelled)$/i } }
        ]
      })
        .populate("user", "fullName") // Buyer
        .populate("branchInfo", "branchName fullAddress") // Seller (Branch)
        .populate({
          path: "items.product",
          select: "productName image user",
          populate: {
            path: "user",
            select: "fullName" // Product's creator
          }
        })
        .sort({ createdAt: -1 });
  
      // console.log("Filtered Orders Found:", orders.length);
  
      const formattedOrders = orders.map(order => {
        const firstItem = order.items?.[0];
        const product = firstItem?.product;
  
        // Buyer name from order.user
        const buyerName = order.user?.fullName || "N/A";
  
        // Seller name (product's creator OR branch name fallback)
        const sellerName =
          product?.user?.fullName || order.branchInfo?.branchName || "Seller";
  
        // Product Info
        const productName = product?.productName || "N/A";
        const productImage = product?.image || "";
  
        // Google Maps Address
        const address = order.deliveryAddress;
        const fullAddress = `${address?.street || ""}, ${address?.city || ""}, ${address?.zipCode || ""}`;
        const encodedAddress = encodeURIComponent(fullAddress);
        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  
        return {
          orderId: order.orderId,
          productName,
          productImage,
          totalPrice: order.totalAmount,
          orderDate: new Date(order.createdAt).toLocaleDateString("en-GB"),
          buyerName,
          sellerName,
          yourEarning: `₹${(order.totalAmount * 0.10).toFixed(0)}`,
          seeLocationUrl: googleMapsUrl,
          status: order.deliveryStatus || order.status || "In Process"
        };
      });
  
      res.status(200).json({ orders: formattedOrders });
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Error fetching orders", error: error.message });
    }
  };
   

   //✅ Confirm payment
  const confirmPayment = async (req, res) => {
    try {
      const { orderId } = req.params;

      const order = await Order.findOne({ orderId: orderId.trim() })
        .populate("user")
        .populate("items.product");
   
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
   
      // ✅ Check if user accepted the delivery
      if (order.deliveryStatus !== "Accepted") {
        return res.status(400).json({ message: "User has not accepted the delivery yet." });
      }
   
      // ✅ Handle payment logic
      let isCash = order.paymentMethod === "Cash" || order.paymentMethod === "COD";
   
      if (isCash) {
        order.cashReceived = true;
      }
   
      order.paymentStatus = "Success";
      order.status = "Delivered";
      order.deliveryStatus = "Delivered";
   
      await order.save();
   
      const responseData = {
        orderId: order.orderId,
        amount: order.totalAmount,
        yourEarning: `₹${(order.totalAmount * 0.10).toFixed(0)}`,
      };
   
      if (order.items.length > 0) {
        const firstProduct = order.items[0].product;
        responseData.productName = firstProduct?.productName || "N/A";
        responseData.productImage = firstProduct?.image || null;
      }
   
      if (isCash) {
        responseData.cashReceived = true;
      } else {
        // Online payment details
        responseData.customerName = order.user?.name || "N/A";
        responseData.date = new Date(order.updatedAt).toLocaleDateString();
        responseData.time = new Date(order.updatedAt).toLocaleTimeString();
        responseData.contactNumber = order.user?.contactNumber || "N/A";
        responseData.gender = order.user?.gender || "N/A";
        responseData.productDetails = order.items.map(item => ({
          productName: item.product?.name || "N/A",
          productImage: item.product?.image || null,
          quantity: item.quantity,
          price: item.price
        }));
      }
   
      return res.status(200).json({
        message: "Payment confirmed successfully",
        data: responseData
      });
   
    } catch (err) {
      console.error("Payment confirmation error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  };
   
  //✅ Get delivery boy summary
  const getDeliveryBoySummary = async (req, res) => {
    try {
      // Accessing the delivery boy ID from the authenticated user (via middleware)
      const deliveryBoyId = req.deliveryBoy.id;
   
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
   
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
   
      // Fetch all delivered orders for this delivery boy
      const allDeliveredOrders = await Order.find({
        deliveryBoy: deliveryBoyId,
        deliveryStatus: "Delivered"
      }).populate("items.product");
   
      // Total delivery boy earning = 10% of each order totalAmount
      const totalEarnings = allDeliveredOrders.reduce((sum, order) => {
        return sum + (order.totalAmount * 0.10 || 0);
      }, 0);
   
      // Today's delivered orders
      const todayDeliveredOrders = allDeliveredOrders.filter(order =>
        order.updatedAt >= todayStart && order.updatedAt <= todayEnd
      );
   
      // Today's earnings = 10% of today's delivered orders
      const todayEarnings = todayDeliveredOrders.reduce((sum, order) => {
        return sum + (order.totalAmount * 0.10 || 0);
      }, 0);
   
      // Prepare list of delivered orders (for UI cards)
      const detailedOrders = allDeliveredOrders.map(order => ({
        orderId: order.orderId,
        productName: order.items[0]?.product?.productName || "N/A",
        image: order.items[0]?.product?.image || null,
        yourEarning: `₹${(order.totalAmount * 0.10).toFixed(0)}`,
        status: order.status
      }));
   
      return res.status(200).json({
        summary: {
          totalEarnings: `₹${totalEarnings.toFixed(0)}`,
          todayDeliveredOrders: todayDeliveredOrders.length,
          todayEarnings: `₹${todayEarnings.toFixed(0)}`
        },
        deliveredOrders: detailedOrders
      });
   
    } catch (err) {
      console.error("Error fetching delivery summary:", err);
      return res.status(500).json({ message: "Server error" });
    }
  };
   
   
   //✅ Get order details
  const getOrderDetails = async (req, res) => {
    try {
      const { orderId } = req.params;
   
      // Fetch order with populated fields for product, user, and seller details
      const order = await Order.findOne({ orderId })
        .populate("items.product") // Populate product details
        .populate("user", "fullName phoneNumber") // Populate buyer details
        .populate("items.product.seller", "name"); // Assuming the product has a reference to the branch/seller
   
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
   
      const product = order.items[0]?.product;
      const address = order.deliveryAddress || {}; // 👈 Pull from deliveryAddress
   
      // Assuming the seller name is fetched from the populated seller field in the product
      const sellerName = product?.seller?.name || "N/A"; 
   
      const orderDetails = {
        orderId: order.orderId,
        productName: product?.productName || "N/A",
        image: product?.image || null,
        totalAmount: `₹${order.totalAmount}`,
        deliveryAddress: {
          name: address?.name || "N/A",
          street: address?.street || "N/A",
          city: address?.city || "N/A",
          zipcode: address?.zipCode || "N/A"
        },
        buyer: {
          name: order.user?.fullName || "N/A", // Full name of the buyer
          contact: order.user?.phoneNumber || "N/A"
        },
        seller: sellerName, // Seller name from the product's seller (Branch)
        date: order.updatedAt.toLocaleDateString(),
        yourEarning: `₹${(order.totalAmount * 0.10).toFixed(0)}`
      };
   
      return res.status(200).json(orderDetails);
   
    } catch (err) {
      console.error("Error getting order details:", err);
      return res.status(500).json({ message: "Server error" });
    }
  };
   
  // ✅ Get date-wise order history for delivery boy
  const getDateWiseOrderHistory = async (req, res) => {
    try {
      // Access the delivery boy ID from the authenticated delivery boy (via middleware)
      const deliveryBoyId = req.deliveryBoy.id;
   
      const { from, to } = req.query;
   
      const startDate = from ? new Date(from) : new Date('2000-01-01');
      startDate.setHours(0, 0, 0, 0);
   
      const endDate = to ? new Date(to) : new Date();
      endDate.setHours(23, 59, 59, 999);
   
      // 1. Fetch delivered orders for the authenticated delivery boy within the specified date range
      const deliveredOrders = await Order.find({
        deliveryBoy: deliveryBoyId,
        deliveryStatus: "Delivered",
        updatedAt: { $gte: startDate, $lte: endDate }
      })
        .populate("user", "name")
        .populate("items.product", "image")
        .sort({ updatedAt: -1 });
   
      // 2. Initialize counters
      let totalEarnings = 0;
      let totalDelivered = 0;
      const dateWiseOrders = {};
   
      // 3. Group orders by date
      deliveredOrders.forEach(order => {
        const deliveryDate = new Date(order.updatedAt);
        const dateKey = deliveryDate.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: '2-digit'
        }); // Example: "Thu Dec 16"
   
        const earning = order.totalAmount * 0.10; // 10% commission
        totalEarnings += earning;
        totalDelivered++;
   
        const orderCard = {
          orderId: order.orderId,
          deliveredOn: `Delivered on ${dateKey}`,
          customerName: order.user?.name || "Customer",
          productImage: order.items[0]?.product?.image || null,
          yourEarning: `₹${earning.toFixed(0)}`
        };
   
        if (!dateWiseOrders[dateKey]) {
          dateWiseOrders[dateKey] = [];
        }
   
        dateWiseOrders[dateKey].push(orderCard);
      });
   
      // 4. Format response to match UI
      const orderHistory = Object.entries(dateWiseOrders).map(([date, orders]) => ({
        date,
        orders
      }));
   
      return res.status(200).json({
        totalDelivered,
        totalEarning: `₹${totalEarnings.toFixed(0)}`,
        orderHistory
      });
    } catch (error) {
      console.error("Error fetching order history:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
   
   
   // ✅ Get order history details
  const getOrderHistoryDetails = async (req, res) => {
    try {
      const { orderId } = req.params;
      const deliveryBoyId = req.deliveryBoy._id; // ✅ Corrected this line
   
      const order = await Order.findOne({
        _id: orderId,
        deliveryBoy: deliveryBoyId,
        deliveryStatus: { $in: ["Accepted", "Delivered"] }
      })
        .populate("user", "fullName") // Buyer's name from User model
        .populate("items.product", "productName image seller") // Product details + seller ref
        .populate("items.product.seller", "fullName"); // Seller's name from User model
   
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
   
      const formatDateTime = (date) => {
        const options = {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        };
        return new Date(date).toLocaleString("en-US", options).replace(",", " at");
      };
   
      const confirmedDate = formatDateTime(order.createdAt);
      const deliveredDate = formatDateTime(order.updatedAt);
   
      const sellerName = order.items[0]?.product?.seller?.fullName || "Unknown Seller";
      const buyerName = order.user?.fullName || "Customer";
   
      const response = {
        orderId: order._id,
        productName: `${order.items[0]?.product?.productName || "Product"}${order.items[0]?.quantity ? `, Pack of ${order.items[0].quantity}` : ""}`,
        productImage: order.items[0]?.product?.image || null,
        buyerName: buyerName,
        sellerName: sellerName,
        totalAmount: `₹${order.totalAmount}`,
        yourEarning: `₹${(order.totalAmount * 0.10).toFixed(0)}`,
        timeline: [
          { label: "Order Confirmed", date: confirmedDate },
          { label: "Delivered On", date: deliveredDate }
        ]
      };
   
      return res.status(200).json(response);
    } catch (error) {
      console.error("Error fetching order detail:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
   
 module.exports = {
    acceptOrder,
    canceldeliveryBoyOrder,
    getAvailableOrders,
    confirmPayment,
    getDeliveryBoySummary,
    getOrderDetails,
    getDateWiseOrderHistory,
    getOrderHistoryDetails
  };  