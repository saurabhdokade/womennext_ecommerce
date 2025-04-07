const mongoose = require("mongoose");
 
const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  deliveryAddress: {
    name: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    zipCode: { type: String, required: true }
  },
  paymentMethod: {
    type: String,
    enum: ["COD", "Online"],
    required: true
  },
  emergencyDelivery: {
    type: Boolean,
    default: false
  },
  totalAmount: {
    type: Number,
    required: true
  },
  deliveryCharges: {
    type: Number,
    default: 0
  },
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Products", required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true }
    }
  ],
  status: {
    type: String,
    enum: ["Pending", "Delivered","Ongoing", "Cancelled", "Confirmed"],
    default: "Pending"
  },
  orderDate: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });
 
const Order = mongoose.model("OrderCart", orderSchema);
 
module.exports = Order;
 
 