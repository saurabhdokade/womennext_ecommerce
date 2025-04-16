const express = require("express");
const router = express.Router();
const { userValidateToken } = require("../../middlewares/userAuthMiddleware");
const { confirmOrder, cancelOrder, getUserOrders, getViewOrderDetails, deliveredOrder, getOrderById,  outForDelivery, orderPlaced } = require("../../controllers/UserControllers/orderNowController");


//✅ User Order Routes
router.get("/details/:orderId", userValidateToken, getOrderById);
router.get("/orders", userValidateToken, getUserOrders);
router.get("/viewOrder/:orderId", userValidateToken, getViewOrderDetails);

//✅ User Order Status
router.put("/confirm/:orderId", userValidateToken, confirmOrder);
router.put("/cancel/:orderId", userValidateToken, cancelOrder);
router.put("/orderPlaced/:orderId", userValidateToken, orderPlaced);
router.put("/delivered/:orderId", userValidateToken, deliveredOrder);


//✅ User Order Status
router.put("/outForDelivery/:orderId", userValidateToken, outForDelivery);




module.exports = router;
