const express = require("express");
const { getAllBranches, getAllDelieveryBoys, getAllCustomers, getAllBranchesDropdown,  getAllOrders, getBranchOverview, getDeliveryReport, getIncomeOverview } = require("../../controllers/SuperAdmin-Controllers/dashboardController");
const router = express.Router();


router.get("/getAllBranches", getAllBranches);
router.get("/getAllDelieveryBoys", getAllDelieveryBoys);
router.get("/getAllCustomers", getAllCustomers);
router.get("/getAllOrders", getAllOrders);
router.get("/getAllBranchesDropdown", getAllBranchesDropdown);
router.get("/getBranchOverview", getBranchOverview);
router.get("/getIncomeOverview", getIncomeOverview);
router.get("/getDeliveryReport", getDeliveryReport);

module.exports = router;


