const express = require("express");
const { getSingleBanner } = require("../../controllers/UserControllers/userBannerController");

const router = express.Router();

router.get("/getBanner/:number", getSingleBanner);

module.exports = router;