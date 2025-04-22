const Order = require("../../models/UserModels/orderNow");
const branchModel = require("../../models/SuperAdminModels/branch");
const Product = require("../../models/SuperAdminModels/Product");
const Delivery = require("../../models/SuperAdminModels/DeliveryBoy") 
const User = require("../../models/UserModels/User");

 
//✅ Get All Delivery Boys
const getAllDelieveryBoys = async (req, res) => {
  try {
    const totalDelieveryBoys = await Delivery.countDocuments();
    return res.status(200).json({ totalDelieveryBoys });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error", success: false, error: error.message });
  }
};
 

//✅ Get All Orders
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.countDocuments();
    return res.status(200).json({ orders });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error", success: false, error: error.message });
  }
};
 
 //✅ Get All Delivered Orders Income
const getAllOrdersDeliveredIncome = async (req, res) => {
  try {
    const result = await Order.aggregate([
      { $match: { status: "Delivered" } },
      {
        $group: {
          _id: null,
          totalIncome: { $sum: "$totalAmount" } // Change to the correct amount field if needed
        }
      }
    ]);
 
    const totalIncome = result[0]?.totalIncome || 0;
 
    return res.status(200).json({
      success: true,
      incomeFromDeliveredOrders: totalIncome
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};
 
 //✅ Get Product Count by Search
const getProductCount = async (req, res) => {
  try {
      const { search = "" } = req.query;
 
      const searchFilter = {
          $or: [
              { brand: { $regex: search, $options: "i" } },
              { productName: { $regex: search, $options: "i" } },
              { productSubType: { $regex: search, $options: "i" } },
          ],
      };
 
      const totalProducts = await Product.countDocuments(searchFilter);
 
      res.status(200).json({
          success: true,
          totalProducts,
      });
  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: error.message });
  }
};
 
 //✅ Get Top Selling Brands by Month
const getTopSellingBrands = async (req, res) => {
  try {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
 
    // Delivered orders for this month
    const salesThisMonth = await Order.aggregate([
      {
        $match: {
          status: "Delivered",
          orderDate: { $gte: startOfThisMonth }
        }
      },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products", // collection name in MongoDB
          localField: "items.product",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      { $unwind: "$productDetails" },
      {
        $group: {
          _id: "$productDetails.brand",
          totalDeliveredThisMonth: { $sum: "$items.quantity" }
        }
      }
    ]);
 
    // Delivered orders for last month
    const salesLastMonth = await Order.aggregate([
      {
        $match: {
          status: "Delivered",
          orderDate: {
            $gte: startOfLastMonth,
            $lte: endOfLastMonth
          }
        }
      },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      { $unwind: "$productDetails" },
      {
        $group: {
          _id: "$productDetails.brand",
          totalDeliveredLastMonth: { $sum: "$items.quantity" }
        }
      }
    ]);
 
    // Merge both months' data
    const brandSales = {};
 
    salesLastMonth.forEach((b) => {
      brandSales[b._id] = {
        brand: b._id,
        salesLastMonth: b.totalDeliveredLastMonth,
        salesThisMonth: 0
      };
    });
 
    salesThisMonth.forEach((b) => {
      if (!brandSales[b._id]) {
        brandSales[b._id] = {
          brand: b._id,
          salesLastMonth: 0,
          salesThisMonth: b.totalDeliveredThisMonth
        };
      } else {
        brandSales[b._id].salesThisMonth = b.totalDeliveredThisMonth;
      }
    });
 
    const result = Object.values(brandSales).sort(
      (a, b) => b.salesThisMonth - a.salesThisMonth
    );
 
    res.status(200).json({
      success: true,
      topDeliveredBrands: result
    });
  } catch (err) {
    console.error("Error in getTopDeliveredBrands:", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: err.message
    });
  }
};
 
 
//✅ Get Recent Orders
const getRecentTrackedOrders = async (req, res) => {
  try {
    const branchAdmin = req.branchAdmin;

    // Step 1: Get the Branch ID from branchAdmin
    const branchId = branchAdmin.branch;

    // Step 2: Find the Branch & its service pin codes
    const branch = await branchModel.findById(branchId);
    if (!branch) {
      return res.status(404).json({ message: "Branch not found." });
    }

    const servicePinCodes = branch.servicePinCode; 

    const users = await User.find({
      address: { $regex: servicePinCodes.join("|") },
    }).select("_id");

    const userIds = users.map(user => user._id);

    // Step 4: Get recent orders from those users
    const recentOrders = await Order.find({
      user: { $in: userIds },
      branchInfo: branchId, 
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("items.product")
      .populate("user");

    const orders = recentOrders.map(order => ({
      // trackingNo: order._id,
      productName: order.items[0]?.product?.productName || "Product",
      totalOrder: order.items.length,
      status: order.deliveryStatus,
      totalAmount: order.totalAmount,
    }));

    return res.status(200).json({ recentOrders: orders });
  } catch (error) {
    console.error("getRecentTrackedOrders error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

module.exports = {
  getAllDelieveryBoys,
  getAllOrders,
  getProductCount,
  getAllOrdersDeliveredIncome,
  getTopSellingBrands,
  getRecentTrackedOrders
};

 