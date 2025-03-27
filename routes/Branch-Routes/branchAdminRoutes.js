const express = require('express');
const {register,login,forgotPassword,verifyOtp,updateAdmin,resetPassword,logout} =  require('../../controllers/Branch-Controllers/branchAdminController')
const router = express.Router();
 
router.post('/register',register);
router.post('/login',login);
router.post('/forgot-password',forgotPassword);
router.post('/verify-otp',verifyOtp);
router.put('/update/:id',updateAdmin);
router.post('/reset-password',resetPassword);
router.get('/logout',logout);
 
module.exports = router;