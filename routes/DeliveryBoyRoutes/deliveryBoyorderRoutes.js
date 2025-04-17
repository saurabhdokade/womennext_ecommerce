const express = require("express");
const router = express.Router();
const { acceptOrder, canceldeliveryBoyOrder, getAvailableOrders, confirmPayment, getDeliveryBoySummary, getOrderDetails, getDateWiseOrderHistory, getOrderHistoryDetails, getavaliableOrderDetails } = require("../../controllers/deliveryBoy-Controllers/deliveryBoyOrdersController");
const deliveryBoyAuthMiddleware = require("../../middlewares/deliveryBoyAuthMiddleware");
 

//✅ Delivery Boy Order Routes

//✅deliveryboy page
router.patch('/accept/:id', deliveryBoyAuthMiddleware, acceptOrder);
router.patch('/cancel/:orderId', deliveryBoyAuthMiddleware, canceldeliveryBoyOrder);
 
 
//✅ deliveryboy summery payment 
router.get('/availableOrders', deliveryBoyAuthMiddleware, getAvailableOrders);
router.get("/:id/details", deliveryBoyAuthMiddleware, getavaliableOrderDetails);
router.post("/:id/payment", deliveryBoyAuthMiddleware,confirmPayment);
router.get("/deliveryboy/summary",  deliveryBoyAuthMiddleware,getDeliveryBoySummary);
router.get("/order/details/:id", deliveryBoyAuthMiddleware, getOrderDetails);
 
 
//✅ history
router.get("/order-history",deliveryBoyAuthMiddleware,getDateWiseOrderHistory)
router.get('/order-history/:id', deliveryBoyAuthMiddleware, getOrderHistoryDetails);
 

module.exports = router;