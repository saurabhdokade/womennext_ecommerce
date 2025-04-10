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

  const getOrderById = async (req, res) => {
    try {
      const { id } = req.params;
   
      const order = await Order.findById(id)
        .populate({
          path: "user",
          select: "name phoneNumber email address",
        })
        .populate({
          path: "branchInfo",
          select: "branchName phoneNumber email",
        })
        .populate({
          path: "items.product",
          select:
            "image productCode brand productName productSubType productDescription size",
        });
   
      if (!order) {
        return res
          .status(404)
          .json({ success: false, message: "Order not found" });
      }
   
      // Assuming one item, or using the first item for simplicity
      const product = order.items[0]?.product;
      const orderQuantity = order.items[0]?.quantity;
      const price = order.items[0]?.price;
   
      const reason =
        order.cancelReason === "Other"
          ? order.otherReason || "NA"
          : order.cancelReason || "NA";
   
      const response = {
        orderId: order._id,
        customerInfo: {
          name: order.user?.name,
          phoneNumber: order.user?.phoneNumber,
          email: order.user?.email,
          address: order.user?.address,
        },
        branchInfo: {
          name: order.branchInfo?.branchName,
          phoneNumber: order.branchInfo?.phoneNumber,
          email: order.branchInfo?.email,
        },
        image: product?.image[0],
        productCode: product?.productCode,
        productBrand: product?.brand,
        productName: product?.productName,
        productSubType: product?.productSubType,
        productDescription: product?.productDescription,
        size: product?.size,
        orderQuantity,
        price,
        deliveryType: order.emergencyDelivery || "NA",
        grandTotal: order.totalAmount,
        orderStatus: order.status,
        paymentMode: order.paymentMethod,
        reason,
      };
   
      res.status(200).json({ success: true, order: response });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ success: false, message: error.message });
    }
  };
   
  module.exports = {
    getAllOrders,
    getOrderById,
  }