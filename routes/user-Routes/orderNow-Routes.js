const express = require("express");
const router = express.Router();
const { userValidateToken } = require("../../middlewares/userAuthMiddleware");
const { confirmOrder, cancelOrder, getUserOrders, getViewOrderDetails, deliveredOrder, getOrderById, packedOrder, arrivedInWarehouse,  nearByCourierFacility, outForDelivery, orderPlaced } = require("../../controllers/UserControllers/orderNowController");


//✅ User Order Routes
router.get("/details/:orderId", userValidateToken, getOrderById);
router.get("/orders", userValidateToken, getUserOrders);
router.get("/viewOrder/:orderId", userValidateToken, getViewOrderDetails);

//✅ User Order Status
router.put("/confirm/:orderId", userValidateToken, confirmOrder);
router.put("/orderPlaced/:orderId", userValidateToken, orderPlaced);
router.put("/delivered/:orderId", userValidateToken, deliveredOrder);
router.put("/cancel/:orderId", userValidateToken, cancelOrder);

//✅ User Order Status
router.put("/packed/:orderId", userValidateToken, packedOrder);
router.put("/arrivedInWarehouse/:orderId", userValidateToken, arrivedInWarehouse);
router.put("/nearByCourierFacility/:orderId", userValidateToken,  nearByCourierFacility);
router.put("/outForDelivery/:orderId", userValidateToken, outForDelivery);




module.exports = router;
