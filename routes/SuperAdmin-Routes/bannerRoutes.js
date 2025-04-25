const express = require("express");
const router = express.Router();
const { upload } = require("../../config/cloudinary");
 const {addBanner, getAllBanners, getBannerById, updateBanner, deleteBanner} = require("../../controllers/SuperAdmin-Controllers/bannerController");

 //✅ SuperAdmin Banner Routes
router.post("/addBanner", upload.array("images", 5), addBanner);
router.get("/getAllBanner", getAllBanners);
router.get("/getBannerById/:id", getBannerById);
router.delete("/deleteBanner/:id", deleteBanner);
router.put("/updateBanner/:id", upload.array("images", 5), updateBanner);

module.exports = router;