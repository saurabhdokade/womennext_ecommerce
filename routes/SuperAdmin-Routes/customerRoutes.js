 
// routes/customerRoutes.js
const express = require("express");
const { upload } = require("../../config/cloudinary");
const {
    getAllCustomers,
    updateCustomer,
    getCustomerById,
    deleteCustomer,
} = require("../../controllers/SuperAdmin-Controllers/customerController");
 
const router = express.Router();
 
router.get("/getAllCustomers", getAllCustomers);
router.get("/getCustomer/:id", getCustomerById);
router.put("/updateCustomer/:id", upload.single("image"), updateCustomer);
router.delete("/deleteCustomer/:id", deleteCustomer);
 
module.exports = router;