const express = require("express");
const router = express.Router();

const { getAllCustomers, getCustomerById } = require("../../controllers/branchAdmin-Controllers/branchAdminCustomerController");

router.get("/getAll-customers", getAllCustomers);
router.get("/customer/:userId", getCustomerById);

module.exports = router;
