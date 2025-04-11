const statusEnum = [
  "Order Placed",
  // "Pending",
  "Delivered",
  "Cancelled",
  "Confirmed",
  "In Process",
  "Order Confirmed",
  "Packed the Product",
  "Arrived in the Warehouse",
  "Nearby Courier Facility",
  "Out for Delivery",
];
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    deliveryAddress: {
      name: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      zipCode: { type: String, required: true },
    },
    paymentMethod: {
      type: String,
      enum: ["COD", "Online"],
      required: true,
    },
    emergencyDelivery: {
      type: Boolean,
      default: false,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Products",
          required: true,
        },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
      },
    ],
    orderSummary: {
      productImage: { type: String },
      items: { type: Number },
      itemTotal: { type: Number },
      deliveryCharges: { type: Number },
      orderTotal: { type: Number },
    },
    status: {
      type: String,
      enum: statusEnum,
      enum:["Delivered", "In Process", "Cancelled","Confirmed"],
      default: "In Process",
    },
    cancelReason: {
      type: String,
      enum:[
        "I want to change the Product",
        "Not available on the delivery time",
        "Price High",
        "I ordered wrong Product",
        "Other",
      ]
    },
    otherReason: {
      type: String,
    },
    orderId: {
      type: String,
      unique: true,
      required: true
    }, 
    orderDate: {
      type: Date,
      default: Date.now,
    },
    deliveryBoy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryBoy",
      required: false,
    },
    branchInfo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branches",
    },

   
    
  },
  { timestamps: true }
);

const Order = mongoose.model("OrderCart", orderSchema);

module.exports = Order;
