const express = require("express");
const router = express.Router();
const { userValidateToken } = require("../../middlewares/userAuthMiddleware");
const { confirmOrder, cancelOrder, getUserOrders, getViewOrderDetails, deliveredOrder, ongoingOrder, getOrderById } = require("../../controllers/UserControllers/orderNowController");

router.get("/details/:orderId", userValidateToken, getOrderById);
router.put("/confirm/:orderId", userValidateToken, confirmOrder);
router.put("/cancel/:orderId", userValidateToken, cancelOrder);
router.get("/orders", userValidateToken, getUserOrders);
router.get("/viewOrder/:orderId", userValidateToken, getViewOrderDetails);
router.put("/delivered/:orderId", userValidateToken, deliveredOrder);
router.put("/ongoing/:orderId", userValidateToken, ongoingOrder);

module.exports = router;
