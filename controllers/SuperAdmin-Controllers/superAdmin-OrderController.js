const Order = require("../../models/UserModels/orderNow");
const branchModel = require("../../models/SuperAdminModels/branch");

const getAllOrders = async (req, res) => {
    try {
      const { query, page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc" } = req.query;
      const sortOrderValue = sortOrder === "desc" ? -1 : 1;
      const sortOptions = { [sortBy]: sortOrderValue };
      const skip = (parseInt(page) - 1) * parseInt(limit);
   
      let orders = await Order.find()
        .sort(sortOptions)
        .populate("user", "fullName phoneNumber email address")
        .populate("items.product", "name price brand productName productDescription productSubType size quantity productCode image");
   
      const allBranches = await branchModel.find();
   
      const enrichedOrders = await Promise.all(
        orders.map(async (order) => {
          const userAddress = order.user?.address || "";
          const matchedBranch = allBranches.find((branch) => {
            const servicePin = branch.servicePinCode?.toString();
            return userAddress.includes(servicePin) || branch.fullAddress.includes(userAddress);
          });
   
          return {
            ...order.toObject(),
            branchInfo: matchedBranch || null,
          };
        })
      );
   
      let filteredOrders = enrichedOrders;
   
      if (query && query.trim() !== "") {
        const searchRegex = new RegExp(query.trim(), "i");
        filteredOrders = enrichedOrders.filter((order) => {
          return (
            searchRegex.test(order.user?.fullName) ||
            searchRegex.test(order.user?.email) ||
            searchRegex.test(order.user?.phoneNumber?.toString()) ||
            searchRegex.test(order.branchInfo?.branchName || "") ||
            searchRegex.test(order.branchInfo?.phoneNumber?.toString() || "") ||
            order.items?.some((item) =>
              searchRegex.test(item.product?.name || "") ||
              searchRegex.test(item.product?.brand || "") ||
              searchRegex.test(item.product?.productName || "") ||
              searchRegex.test(item.product?.productDescription || "")
            )
          );
        });
      }
   
      const totalOrders = filteredOrders.length;
      const totalPages = Math.ceil(totalOrders / parseInt(limit));
      const paginatedOrders = filteredOrders.slice(skip, skip + parseInt(limit));
   
      const simplifiedOrders = paginatedOrders.map((order) => ({
          orderDate: order.orderDate,
          orderId: order._id,
          orderStatus: order.status || order.orderStatus ,      
      }));
   
      res.status(200).json({
        success: true,
        message: "Orders fetched successfully",
        data: simplifiedOrders,
        pagination: {
          total: totalOrders,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: totalPages,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch orders",
        error: error.message,
      });
    }
  };

  module.exports = {
    getAllOrders
  }