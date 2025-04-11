const express = require("express");
const { userValidateToken } = require("../../middlewares/userAuthMiddleware");
const { upload } = require("../../config/cloudinary");
const {
    addReview,
    getAllReviews,
    getAverageRatings,
} = require("../../controllers/UserControllers/reviewController");
 
const router = express.Router();
 
//✅ User Review Routes
router.post(
    "/addReview/:productId",
    userValidateToken,
    upload.array("files", 5),
    addReview
);
 
router.get("/getAllReviews/:productId", getAllReviews);
 
router.get("/getAverageRatings/:productId", getAverageRatings);
 
module.exports = router;