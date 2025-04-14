const express = require("express");
const {
    getAllProducts,
    getProductById,
} = require("../../controllers/branchAdmin-Controllers/branchAdminProductController");
const router = express.Router();
 
//✅ Branch Admin Product Routes
router.get("/getAllProducts", getAllProducts);
router.get("/getProductById/:id", getProductById);
 
 
module.exports = router;