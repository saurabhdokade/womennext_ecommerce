const Order = require("../../models/UserModels/orderNow");
const DeliveryBoy = require("../../models/SuperAdminModels/DeliveryBoy");
const User = require("../../models/UserModels/User");
const Product = require("../../models/SuperAdminModels/Product");

// ✅ Get Payment History with Proper Product Name Retrieval
const getPaymentHistory = async (req, res) => {
  try {
    let { date, paymentMethod, page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const filter = {};

    filter.deliveryStatus = "Delivered";

    if (date) {
      const [day, month, year] = date.split("/").map(Number);
      const parsedDate = new Date(year, month - 1, day); // JavaScript me month 0-based hota hai

      if (!isNaN(parsedDate.getTime())) {
        const startOfDay = new Date(parsedDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(parsedDate.setHours(23, 59, 59, 999));
        filter.orderDate = { $gte: startOfDay, $lte: endOfDay };
      } else {
        return res.status(400).json({
          message: "Invalid date format. Please provide a valid date.",
        });
      }
    }

    if (paymentMethod) {
      filter.paymentMethod = paymentMethod;
    }
    const orders = await Order.find(filter)
      .populate({
        path: "deliveryBoy",
        model: "DeliveryBoy", // ✅ Must match model registration name
        select: "fullName", // ✅ Only fetch the fullName field
      })
      .populate({
        path: "items.product",
        model: "Products",
        select: "productName",
      })
      .sort({ orderDate: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    // console.log(orders)
    const totalRecords = await Order.countDocuments(filter);

    const totalPages = Math.ceil(totalRecords / limit);
    const hasPrevious = page > 1;
    const hasNext = page < totalPages;

    const paymentHistory = orders.map((order) => ({
      _id: order._id,
      date: new Date(order.orderDate).toLocaleDateString("en-GB"),
      productName:
        order.items.length > 0 && order.items[0].product?.productName
          ? order.items[0].product.productName
          : "N/A",
      deliveryBoyName: order.deliveryBoy?.fullName || "N/A",
      status: order.deliveryStatus ? "Paid" : "Not Paid",
    }));

    res.status(200).json({
      success: true,
      totalPages,
      currentPage: page,
      previous: hasPrevious,
      next: hasNext,
      totalRecords,
      paymentHistory,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

// ✅ View Payment History for a Specific Delivery Boy (Using Orders)
const viewPaymentByDeliveryBoy = async (req, res) => {
  try {
    const { deliveryBoyId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const orders = await Order.find({
      deliveryBoy: deliveryBoyId,
      outForDeliveryAt: {
        $gte: today,
        $lt: tomorrow,
      },
    })
      .populate({ path: "deliveryBoy", model: DeliveryBoy, select: "fullName" })
      .populate({ path: "user", model: User, select: "fullName" })
      .populate({ path: "items.product", model: Product, select: "productName" })
      .sort({ orderDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    if (!orders.length) {
      return res.status(404).json({
        message: "No payment history found for the selected delivery boy today.",
      });
    }

    const grandTotal = orders.reduce((sum, order) => sum + order.totalAmount, 0);

    return res.status(200).json({
      success: true,
      deliveryBoy: {
        _id: orders[0].deliveryBoy._id,
        fullName: orders[0].deliveryBoy.fullName,
        Date: new Date(orders[0].outForDeliveryAt).toLocaleDateString("en-GB"),
      },
      grandTotal,
      totalRecords: orders.length,
      paymentHistory: orders.map((order, index) => ({
        _id: order._id,
        productName:
          order.items.length > 0 && order.items[0].product?.productName
            ? order.items[0].product.productName
            : "N/A",
        customerName: order.user?.fullName || "N/A",
        totalAmount: order.totalAmount,
        status: order.deliveryStatus || "Not Given By Delivery Boy Yet",
      })),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};



module.exports = { getPaymentHistory, viewPaymentByDeliveryBoy };
