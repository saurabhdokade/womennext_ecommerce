const express = require('express');
const {register, login, resetPassword, forgotPassword, verifyOtp, logout, updateAdmin} =  require('../../controllers/Admin-Controllers/adminController')
 
const router = express.Router();
 
// Admin Routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);
router.put('/update/:id', updateAdmin);
router.post('/logout', logout);
 
module.exports = router;