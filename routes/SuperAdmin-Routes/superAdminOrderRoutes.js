const express = require("express");
const router = express.Router();

const { getAllOrders } = require("../../controllers/SuperAdmin-Controllers/superAdmin-OrderController");

router.get("/getAllOrders", getAllOrders);

module.exports = router;
