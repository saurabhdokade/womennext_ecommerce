const express = require("express");
const {
    getAllDeliveryBoys,
    addDeliveryBoy,
    getDeliveryBoyById,
    updateDeliveryBoy,
    deleteDeliveryBoy,
} = require("../../controllers/SuperAdmin-Controllers/deliveryController");
const { upload } = require("../../config/cloudinary");
const router = express.Router();
 
router.get("/getAllDeliveryBoys", getAllDeliveryBoys);
router.get("/getDeliveryBoyById/:id", getDeliveryBoyById);
router.post("/addDeliveryBoy", upload.single("image"), addDeliveryBoy);
router.put(
    "/updateDeliveryBoy/:id",
    upload.single("image"),
    updateDeliveryBoy
);
router.delete("/deleteDeliveryBoy/:id", deleteDeliveryBoy);
 
module.exports = router;