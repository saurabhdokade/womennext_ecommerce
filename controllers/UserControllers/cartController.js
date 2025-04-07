const Cart = require("../../models/UserModels/CartModel")
const Product = require('../../models/SuperAdminModels/Product');
const Order = require("../../models/UserModels/orderNow");
const branchModel = require("../../models/SuperAdminModels/branch");
//Add Item  To Cart
const addToCart = async (req, res) => {
    try {
        const { quantity } = req.body;
        const { productId } = req.params;
        const userId = req.user.id;
 
        const parsedQuantity = Number(quantity);
        if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
            return res.status(400).json({ success: false, message: "Invalid quantity" });
        }
 
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }
 
        let cart = await Cart.findOne({ userId });
 
        if (!cart) {
            cart = new Cart({ userId, items: [], totalAmount: 0 });
        }
 
        const existingItemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
 
        if (existingItemIndex !== -1) {
            cart.items[existingItemIndex].quantity += parsedQuantity;
        } else {
            cart.items.push({ productId, quantity: parsedQuantity, price: product.price });
        }
 
        cart.totalAmount = cart.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
 
        await cart.save();
    return res.status(200).json({ success: true, message: "Item added to cart", cart });

    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};
 
// Increment Quantity
const incrementCartItem = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user.id;
 
        let cart = await Cart.findOne({ userId });
 
        if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });
 
        const existingItem = cart.items.find(item => item.productId.toString() === productId);
 
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            return res.status(404).json({ success: false, message: "Product not in cart" });
        }
 
        cart.totalAmount = cart.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
 
        await cart.save();
       return  res.status(200).json({ success: true, message: "Quantity increased", cart });
 
    } catch (error) {
       return  res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};
 
// Decrement Quantity
const decrementCartItem = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user.id;
 
        let cart = await Cart.findOne({ userId });
 
        if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });
 
        const existingItemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
 
        if (existingItemIndex !== -1) {
            if (cart.items[existingItemIndex].quantity > 1) {
                cart.items[existingItemIndex].quantity -= 1;
            } else {
                cart.items.splice(existingItemIndex, 1);
            }
        } else {
            return res.status(404).json({ success: false, message: "Product not in cart" });
        }
 
        cart.totalAmount = cart.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
 
        await cart.save();
       return  res.status(200).json({ success: true, message: "Quantity decreased", cart });
 
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};  
 
 
//Remove Item From Cart
  const removeFromCart = async (req, res) => {
    try {
      const userId = req.user.id;
      const { productId } = req.params; 
  
      let cart = await Cart.findOne({ userId });
  
      if (!cart) {
        return res.status(404).json({ success: false, message: "Cart not found" });
      }
  
      const itemIndex = cart.items.findIndex(
        (item) => item.productId.toString() === productId
      );
  
      if (itemIndex === -1) {
        return res.status(404).json({ success: false, message: "Item not found in cart" });
      }
  
      cart.items.splice(itemIndex, 1); 
  
      cart.totalAmount = cart.items.reduce(
        (sum, item) => sum + item.quantity * item.price,
        0
      );
  
      await cart.save();
      return res.status(200).json({ success: true, message: "Item removed from cart", cart });
  
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
  };
 
  // Craete Order From Cart
  const BuyOrderFromCart = async (req, res) => {
    try {
      const userId = req.user.id;
  
      const cart = await Cart.findOne({ userId }).populate("items.productId");
  
      if (!cart || cart.items.length === 0) {
        return res.status(400).json({ message: "Cart is empty. Add products first." });
      }
  
      const {
        deliveryBoy,
        branchName,
        deliveryAddress,
        paymentMethod,
        emergencyDelivery,
        
      } = req.body;
  
      const emergency = emergencyDelivery === "true" || emergencyDelivery === true;
  
      let totalAmount = 0;
      let orderItems = [];
      let insufficientStockProducts = [];
  
      for (const item of cart.items) {
        const product = item.productId;
  
        if (!product) {
          return res.status(400).json({ message: "One of the products in your cart is missing." });
        }
  
        if (product.stock < item.quantity) {
          insufficientStockProducts.push(product.productName || product.name);
          continue;
        }
  
        totalAmount += item.quantity * item.price;
        orderItems.push({
          product: product._id,
          quantity: item.quantity,
          price: item.price,
        });
  
        product.stock -= item.quantity;
        await product.save();
      }
  
      if (insufficientStockProducts.length > 0) {
        return res.status(400).json({
          message: `Not enough stock for: ${insufficientStockProducts.join(", ")}`,
        });
      }
  
      if (emergency) totalAmount += 20;
  
      // Branch detection logic
      let branchInfo = null;
  
      if (branchName) {
        const branch = await branchModel.findOne({ branchName });
        if (branch) {
          branchInfo = branch._id;
        } else {
          return res.status(404).json({
            message: `Branch with name "${branchName}" not found.`,
          });
        }
      } else {
        const allBranches = await branchModel.find();
        const addressString = typeof deliveryAddress === "string" ? deliveryAddress : JSON.stringify(deliveryAddress);
        const matchedBranch = allBranches.find((branch) => {
          const pins = Array.isArray(branch.servicePinCode)
            ? branch.servicePinCode.map(code => code.toString())
            : [branch.servicePinCode?.toString()];
          return pins.some(pin => addressString.includes(pin)) ||
                 addressString.includes(branch.fullAddress);
        });
  
        if (matchedBranch) {
          branchInfo = matchedBranch._id;
        }
      }
  
      const newOrder = new Order({
        user: userId,
        deliveryBoy,
        branchInfo,
        deliveryAddress,
        paymentMethod,
        totalAmount,
        emergencyDelivery: emergency,
        deliveryCharges: emergency ? 20 : 0,
        items: orderItems,
      });
  
      await newOrder.save();
      await Cart.findOneAndDelete({ userId });
  
      return res.status(201).json({
        message: "Order placed successfully",
        order: newOrder,
        emergencyDelivery: emergency ? "₹20 Emergency Delivery Charges applied" : "No Emergency Delivery Charges"
      });
  
    } catch (error) {
      console.error("Server Error:", error);
      return res.status(500).json({ message: "Server error", error: error.message });
    }
  };
  
  
  // Save for later
  const saveForLater = async (req, res) => {
    try {
      const userId = req.user.id;
      const { productId } = req.params;
  
      const cart = await Cart.findOne({ userId });
  
      if (!cart) {
        return res.status(404).json({ success: false, message: "Cart not found" });
      }
  
      const itemIndex = cart.items.findIndex(
        (item) => item.productId.toString() === productId
      );
  
      if (itemIndex === -1) {
        return res.status(404).json({ success: false, message: "Item not found in cart" });
      }
  
      const itemToSave = cart.items[itemIndex];
  
      cart.items.splice(itemIndex, 1);
  
      cart.savedForLater.push(itemToSave);
  
      cart.totalAmount = cart.items.reduce(
        (sum, item) => sum + item.quantity * item.price,
        0
      );
  
      await cart.save();
  
      res.status(200).json({
        success: true,
        message: "Item moved to Save For Later",
        cart
      });
  
    } catch (error) {
      res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
  };
 
  // Move to cart
const moveToCart = async (req, res) => {
    try {
      const userId = req.user.id;
      const { productId } = req.params;
  
      const cart = await Cart.findOne({ userId });
  
      if (!cart) {
        return res.status(404).json({
          success: false,
          message: "Cart not found",
        });
      }
  
      const savedItemIndex = cart.savedForLater.findIndex(
        (item) => item.productId.toString() === productId
      );
  
      if (savedItemIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Item not found in saved for later",
        });
      }
  
      const savedItem = cart.savedForLater[savedItemIndex];
  
      const existingCartItem = cart.items.find(
        (item) => item.productId.toString() === productId
      );
  
      if (existingCartItem) {
        existingCartItem.quantity += savedItem.quantity;
      } else {
        cart.items.push({
          productId: savedItem.productId,
          quantity: savedItem.quantity,
          price: savedItem.price,
        });
      }
  
      cart.savedForLater.splice(savedItemIndex, 1);
  
      cart.totalAmount = cart.items.reduce(
        (sum, item) => sum + item.quantity * item.price,
        0
      );
  
      await cart.save();
  
      return res.status(200).json({
        success: true,
        message: "Item moved to cart",
        cart,
      });
    } catch (error) {
      console.error("Move to cart error:", error);
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  };
 
  





  module.exports = {
    addToCart,
    incrementCartItem,
    decrementCartItem,
    removeFromCart,
    BuyOrderFromCart,
    saveForLater,
    moveToCart,
  };
  