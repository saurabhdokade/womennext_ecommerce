const express = require("express");
const {
    getAllProducts,
    getProductById,
} = require("../../controllers/BranchAdmin-Controllers/branchAdminProductController");
const router = express.Router();
 
router.get("/getAllProducts", getAllProducts);
router.get("/getProductById/:id", getProductById);
 
 
module.exports = router;