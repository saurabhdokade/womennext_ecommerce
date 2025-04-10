const express = require("express");
const router = express.Router();

const { getAllOrders, getOrderById } = require("../../controllers/SuperAdmin-Controllers/superAdmin-OrderController");

router.get("/getAllOrders", getAllOrders);
router.get("/getOrderById/:id", getOrderById);
module.exports = router;
