const express = require("express");
const router = express.Router();
const { userValidateToken } = require("../../middlewares/userAuthMiddleware");
const { addToCart, removeFromCart, BuyOrderFromCart, incrementCartItem, decrementCartItem, saveForLater, moveToCart } = require("../../controllers/UserControllers/cartController");



router.post("/addtocart/:productId",userValidateToken,addToCart);
router.delete("/remove/:productId", userValidateToken, removeFromCart);
router.post('/buyNow', userValidateToken, BuyOrderFromCart);
router.put("/increment/:productId", userValidateToken,incrementCartItem);
router.put("/decrement/:productId",userValidateToken, decrementCartItem);
router.post("/saveForLater/:productId", userValidateToken, saveForLater);
router.post("/moveToCart/:productId", userValidateToken, moveToCart);

module.exports = router;
