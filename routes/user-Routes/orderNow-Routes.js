const express = require("express");
const router = express.Router();
const { userValidateToken } = require("../../middlewares/userAuthMiddleware");
const { confirmOrder, cancelOrder, getUserOrders, getViewOrderDetails, deliveredOrder, ongoingOrder, getOrderById, packedOrder, arrivedInWarehouse,  nearByCourierFacility, outForDelivery } = require("../../controllers/UserControllers/orderNowController");


router.get("/details/:orderId", userValidateToken, getOrderById);
router.get("/orders", userValidateToken, getUserOrders);
router.get("/viewOrder/:orderId", userValidateToken, getViewOrderDetails);

//Order Status
router.put("/confirm/:orderId", userValidateToken, confirmOrder);
router.put("/ongoing/:orderId", userValidateToken, ongoingOrder);
router.put("/delivered/:orderId", userValidateToken, deliveredOrder);
router.put("/cancel/:orderId", userValidateToken, cancelOrder);

//Order Status
router.put("/packed/:orderId", userValidateToken, packedOrder);
router.put("/arrivedInWarehouse/:orderId", userValidateToken, arrivedInWarehouse);
router.put("/nearByCourierFacility/:orderId", userValidateToken,  nearByCourierFacility);
router.put("/outForDelivery/:orderId", userValidateToken, outForDelivery);




module.exports = router;
