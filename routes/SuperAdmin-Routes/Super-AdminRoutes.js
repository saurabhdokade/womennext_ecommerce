const express = require('express');
const {register, login, resetPassword, forgotPassword, verifyOtp, logout, updateAdminProfile, getAdminProfile, changeAdminPasswordAtProfile} =  require('../../controllers/SuperAdmin-Controllers/SuperAdminController')
const { upload } = require('../../config/cloudinary');
 
const router = express.Router();
 
// Admin Routes
router.post('/register',upload.fields([
    { name: "profileImage", maxCount: 1 },
  ]),register)
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);
router.put('/UpdateProfile/:id', upload.fields([
  { name: "profileImage", maxCount: 1 },
]), updateAdminProfile);
router.post('/logout', logout);
router.get('/get-admin-profile/:id', getAdminProfile);
router.put('/change-password/:id', changeAdminPasswordAtProfile);
 
module.exports = router;