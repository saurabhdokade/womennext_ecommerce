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
    deliveryCharges: {
      type: Number,
      default: 0,
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
    status: {
      type: String,
      enum: statusEnum,
      default: "Order Placed",
    },
    // orderDate: {
    //   type: Date,
    //   default: Date.now,
    // },
    deliveryBoy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryBoy",
      required: false,
    },
    branchInfo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branches",
    },

    //Status Timeline
    statusTimeline: {
      orderPlaced: { type: Date, default: Date.now },
      orderConfirmed: { 
        type: Date, 
        default: () => new Date(Date.now() + 1 * 60 * 60 * 1000) // +1 hr
      },
      packed: { 
        type: Date, 
        default: () => new Date(Date.now() + 14 * 60 * 60 * 1000) // +14 hr
      },
      arrivedAtWarehouse: { 
        type: Date, 
        default: () => new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000) // +1 day 2 PM
      },
      nearCourierFacility: { 
        type: Date, 
        default: () => new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000) // +1 day 3 PM
      },
      outForDelivery: { 
        type: Date, 
        default: () => new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000) // +2 day 2 PM
      },
      delivered: { 
        type: Date, 
        default: () => new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000) // +2 day 4 PM
      }
    },
    tracking: [
      {
        status: String,
        date: { type: Date, default: Date.now }
      }
    ],
   
    
  },
  { timestamps: true }
);

const Order = mongoose.model("OrderCart", orderSchema);

module.exports = Order;
