const express = require("express");
const router = express.Router();
const { userValidateToken } = require("../../middlewares/userAuthMiddleware");
const { addToCart, removeFromCart, BuyOrderFromCart,getCartItemCount, BuyNow,incrementCartItem, decrementCartItem, saveForLater, moveToCart, removeItemFromCart, getCart } = require("../../controllers/UserControllers/cartController");


//✅ User Cart Routes
router.post("/addtocart/:productId",userValidateToken,addToCart);
router.get('/cart/count', userValidateToken, getCartItemCount);
router.get("/getCarts", userValidateToken, getCart);
router.delete("/remove/:productId", userValidateToken, removeFromCart);
router.put("/increment/:productId", userValidateToken,incrementCartItem);
router.put("/decrement/:productId",userValidateToken, decrementCartItem);
router.post('/buyNow', userValidateToken, BuyOrderFromCart);
router.post("/buy-now/:productId", userValidateToken, BuyNow);
router.post("/saveForLater/:productId", userValidateToken, saveForLater);
router.post("/moveToCart/:productId", userValidateToken, moveToCart);


module.exports = router;
