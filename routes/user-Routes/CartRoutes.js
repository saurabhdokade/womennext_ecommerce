const express = require("express");
const router = express.Router();
const { userValidateToken } = require("../../middlewares/userAuthMiddleware");
const { addToCart, removeFromCart, BuyOrderFromCart, incrementCartItem, decrementCartItem } = require("../../controllers/UserControllers/cartController");



router.post("/addtocart/:productId",userValidateToken,addToCart);
router.delete("/remove/:productId", userValidateToken, removeFromCart);
router.post('/buyNow', userValidateToken, BuyOrderFromCart);
router.put("/increment/:productId", userValidateToken,incrementCartItem);
router.put("/decrement/:productId",userValidateToken, decrementCartItem);

module.exports = router;
