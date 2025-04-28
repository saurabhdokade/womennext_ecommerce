const express = require("express");
const router = express.Router();
const {getTopSellingBrands, getRecentOrders,getProductCount,getAllOrdersDeliveredIncome,getAllDelieveryBoys,getAllOrders} = require("../../controllers/branchAdmin-Controllers/branchAdminDashboardController");
const branchAdminAuthMiddleware = require("../../middlewares/branchAdminMiddleware");
 


//✅ Branch Admin Dashboard Routes
router.get("/deliveryBoyCount", branchAdminAuthMiddleware, getAllDelieveryBoys);
router.get("/totalOrderCount", branchAdminAuthMiddleware, getAllOrders);
router.get("/delivered-income", getAllOrdersDeliveredIncome);
router.get('/totalProductCount', getProductCount);
router.get("/top-brands", getTopSellingBrands);
router.get("/recent-orders", getRecentOrders);

 


 
module.exports = router;