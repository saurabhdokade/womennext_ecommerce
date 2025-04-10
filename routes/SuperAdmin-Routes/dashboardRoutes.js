const express = require("express");
const {
    getAllBranchesCount,
    getAllDelieveryBoysCount,
    getAllCustomersCount,
    getAllBranchesDropdown,
    getAllOrdersCount,
    getBranchOverview,
    getDeliveryReport,
    getIncomeOverview,
} = require("../../controllers/SuperAdmin-Controllers/dashboardController");
const router = express.Router();
 
router.get("/getAllBranchesCount", getAllBranchesCount);
router.get("/getAllDelieveryBoysCount", getAllDelieveryBoysCount);
router.get("/getAllCustomersCount", getAllCustomersCount);
router.get("/getAllOrdersCount", getAllOrdersCount);
router.get("/getAllBranchesDropdown", getAllBranchesDropdown);
router.get("/getBranchOverview", getBranchOverview);
router.get("/getIncomeOverview", getIncomeOverview);
router.get("/getDeliveryReport", getDeliveryReport);
 
module.exports = router;