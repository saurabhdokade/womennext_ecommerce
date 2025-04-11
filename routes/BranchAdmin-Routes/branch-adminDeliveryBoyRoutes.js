const express = require("express");
const {
    getAllDeliveryBoys,
    getDeliveryBoyById,
    getOrderDetailsByDeliveryBoyId,
    getDeliveryBoyDropdown,
} = require("../../controllers/branchAdmin-Controllers/branchAdminDeliveryBoyController");
const router = express.Router();
 
//✅ Branch Admin Delivery Boy Routes
router.get("/getAllDeliveryBoys", getAllDeliveryBoys);
router.get("/getDeliveryBoyById/:id", getDeliveryBoyById);
router.get("/getOrderDetailsByDeliveryBoyId/:id", getOrderDetailsByDeliveryBoyId);
router.get("/DeliveryBoyDropdown", getDeliveryBoyDropdown);
 
module.exports = router;