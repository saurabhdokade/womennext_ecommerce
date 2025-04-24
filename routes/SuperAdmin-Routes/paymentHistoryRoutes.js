const express = require('express');
const { getPaymentHistory, viewPaymentByDeliveryBoy } = require('../../controllers/SuperAdmin-Controllers/PaymentHistoryController');

const router = express.Router();

router.get('/payment-history', getPaymentHistory);
router.get('/payment-history/:deliveryBoyId', viewPaymentByDeliveryBoy);

module.exports = router;