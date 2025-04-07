const express = require("express");
const router = express.Router();

const { getAllBranchOrders, getOrderBranchDetails } = require("../../controllers/branchAdmin-Controllers/branchOrderController");

router.get("/all-branch-orders", getAllBranchOrders);
router.get("/order-details/:orderId", getOrderBranchDetails);

module.exports = router;