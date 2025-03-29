const express = require("express");
const {
    login,
    verifyOtp,
    resendOtp,
    getUser,
    updateUser,
} = require("../../controllers/UserControllers/userController");
const { userValidateToken } = require("../../middlewares/userAuthMiddleware");
const { upload } = require("../../config/cloudinary");
 
const router = express.Router();
 
// User Routes
router.post("/login", login);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
 
router.get("/getUser", userValidateToken, getUser);
router.put(
    "/updateUser",
    userValidateToken,
    upload.single("image"),
    updateUser
);
 
module.exports = router;