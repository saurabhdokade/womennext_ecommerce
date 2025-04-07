
const Order = require("../../models/UserModels/orderNow");
const branchModel = require("../../models/SuperAdminModels/branch");

//getAllBranchOrders
const getAllBranchOrders = async (req, res) => {
    try {
      const { query, page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc" } = req.query;
      const sortOrderValue = sortOrder === "desc" ? -1 : 1;
      const sortOptions = { [sortBy]: sortOrderValue };
      const skip = (parseInt(page) - 1) * parseInt(limit);
  
      let orders = await Order.find()
        .sort(sortOptions)
        .populate("user", "fullName phoneNumber email address")
        .populate("items.product", "productName image");
  
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
              searchRegex.test(item.product?.name || "")
            )
          );
        });
      }
  
      const totalOrders = filteredOrders.length;
      const totalPages = Math.ceil(totalOrders / parseInt(limit));
      const paginatedOrders = filteredOrders.slice(skip, skip + parseInt(limit));
  
      const simplifiedOrders = paginatedOrders.map((order) => ({
        customerInfo: {
          name: order.user?.fullName,
          phone: order.user?.phoneNumber,
          email: order.user?.email,
          address: order.user?.address,
        },
        products: order.items?.map(item => ({
          name: item.product?.productName,
          image: item.product?.image?.[0] || null,    
        })),
        orderStatus: order.status || order.orderStatus,
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

  //getOrderBranchDetails
  const getOrderBranchDetails = async (req, res) => {
    try {
      const { orderId } = req.params;
  
      if (!orderId) {
        return res.status(400).json({
          success: false,
          message: "Order ID is required",
        });
      }
  
      const order = await Order.findById(orderId)
        .populate("user", "fullName phoneNumber email address")
        .populate(
          "items.product",
          "productCode brand productName productSubType productDescription size price image"
        )
        .populate("branchInfo"); 
  
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }
  
      let matchedBranch = null;
  
      if (order.branchInfo) {
        matchedBranch = {
          id: order.branchInfo._id,
          name: order.branchInfo.branchName,
          phone: order.branchInfo.phoneNumber,
          fullAddress: order.branchInfo.fullAddress,
        };
      } else {
        const allBranches = await branchModel.find();
        const userAddress = order.user?.address?.toLowerCase() || "";
  
        const found = allBranches.find((branch) => {
          const servicePin = branch.servicePinCode?.toString() || "";
          const fullBranchAddress = branch.fullAddress?.toLowerCase() || "";
  
          return (
            userAddress.includes(servicePin) ||
            fullBranchAddress.includes(userAddress) ||
            userAddress.includes(fullBranchAddress)
          );
        });
  
        if (found) {
          matchedBranch = {
            id: found._id,
            name: found.branchName,
            phone: found.phoneNumber,
            fullAddress: found.fullAddress,
          };
        }
      }
  
      const orderDetails = {
        orderId: order._id,
        orderStatus: order.orderStatus || order.status,
        status: order.status,
        cancelReason: order.cancelReason || null,
        otherReason: order.otherReason || null,
        deliveryType: order.deliveryType || null,
        paymentMethod: order.paymentMethod,
        emergencyDelivery: order.emergencyDelivery,
        GrandTotal: order.totalAmount,
        deliveryCharges: order.deliveryCharges,
  
        customers: {
          id: order.user?._id,
          name: order.user?.fullName,
          phone: order.user?.phoneNumber,
          email: order.user?.email,
          address: order.user?.address,
        },
  
        branchInfo: matchedBranch,
  
        items: order.items?.map((item) => ({
          productId: item.product?._id,
          productCode: item.product?.productCode,
          brand: item.product?.brand,
          productName: item.product?.productName,
          productSubType: item.product?.productSubType,
          productDescription: item.product?.productDescription,
          size: item.product?.size,
          unitPrice: item.product?.price,
          quantity: item.quantity,
          totalPrice: item.quantity * item.product?.price,
          image: item.product?.image?.[0] || null,
        })),
      };
  
      res.status(200).json({
        success: true,
        message: "Order details fetched successfully",
        data: orderDetails,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch order details",
        error: error.message,
      });
    }
  };

  module.exports = {
    getAllBranchOrders,
    getOrderBranchDetails
  };
