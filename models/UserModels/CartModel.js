const mongoose = require("mongoose");
 
const cartSchema = mongoose.Schema(
  {
    userId: {   // ✅ UserId Cart ke top-level pe hona chahiye
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,  // ✅ UserId required hoga
      unique: true  // ✅ Har user ka ek hi cart hoga
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Products",
          required: true
        },
        quantity: {
          type: Number,
          required: true,
          default: 1
        },
        price: {
          type: Number,
          required: true
        }
      }
    ],
    totalAmount: {
      type: Number,
      required: true,
      default: 0
    }
  },
  { timestamps: true }
);
 
module.exports = mongoose.model("Cart", cartSchema);
 