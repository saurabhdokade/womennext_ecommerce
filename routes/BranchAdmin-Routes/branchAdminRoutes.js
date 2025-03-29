const express = require('express');
const {register,login,forgotPassword,verifyOtp,resetPassword,logout, getBranchAdminProfile, updateBranchAdminProfile, changeAdminPassAtProfile} =  require('../../controllers/BranchAdmin-Controllers/branchAdminController')
const router = express.Router();
const { upload } = require('../../config/cloudinary');
 
router.post('/register', upload.fields([
    { name: "profileImage", maxCount: 1 },]) ,register);
router.post('/login',login);
router.post('/forgot-password',forgotPassword);
router.post('/verify-otp',verifyOtp);
router.put('/updateProfile/:id', upload.fields([
    { name: "profileImage", maxCount: 1 },
  ]), updateBranchAdminProfile);
router.post('/reset-password',resetPassword);
router.get('/logout',logout);
router.get('/getProfile/:id', getBranchAdminProfile);


router.put('/change-password/:id', changeAdminPassAtProfile);
 
module.exports = router;