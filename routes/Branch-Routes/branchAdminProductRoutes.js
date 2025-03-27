const express = require("express");
const {
    getAllProducts,
    getProductById,
} = require("../../controllers/Branch-Controllers/branchAdminProductController");
const router = express.Router();
 
router.get("/getAllProducts", getAllProducts);
router.get("/getProductById/:id", getProductById);
 
 
module.exports = router;