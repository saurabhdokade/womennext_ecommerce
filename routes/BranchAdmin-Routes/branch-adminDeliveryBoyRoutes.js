const express = require("express");
const {
    getAllDeliveryBoys,
    getDeliveryBoyById,
} = require("../../controllers/BranchAdmin-Controllers/branchAdminDeliveryBoyController");
const router = express.Router();
 
// Delivery Boy Routes
router.get("/getAllDeliveryBoys", getAllDeliveryBoys);
router.get("/getDeliveryBoyById/:id", getDeliveryBoyById);
 
module.exports = router;