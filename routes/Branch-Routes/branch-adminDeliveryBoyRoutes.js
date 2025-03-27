const express = require("express");
const {
    getAllDeliveryBoys,
    getDeliveryBoyById,
} = require("../../controllers/Branch-Controllers/branchAdminDeliveryBoyController");
const router = express.Router();
 
router.get("/getAllDeliveryBoys", getAllDeliveryBoys);
router.get("/getDeliveryBoyById/:id", getDeliveryBoyById);
 
module.exports = router;