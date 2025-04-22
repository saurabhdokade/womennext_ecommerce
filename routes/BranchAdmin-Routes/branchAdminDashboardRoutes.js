const express = require("express");
const router = express.Router();
const {getTopSellingBrands,getProductCount,getAllOrdersDeliveredIncome,getAllDelieveryBoys,getAllOrders, getRecentTrackedOrders} = require("../../controllers/branchAdmin-Controllers/branchAdminDashboardController");
const branchAdminAuthMiddleware = require("../../middlewares/branchAdminMiddleware");
 


//✅ Branch Admin Dashboard Routes
router.get("/deliveryBoyCount", getAllDelieveryBoys);
router.get("/totalOrderCount", getAllOrders);
router.get("/delivered-income", getAllOrdersDeliveredIncome);
router.get('/totalProductCount', getProductCount);
router.get("/top-brands", getTopSellingBrands);
router.get("/recent-orders",branchAdminAuthMiddleware,getRecentTrackedOrders);

 


 
module.exports = router;