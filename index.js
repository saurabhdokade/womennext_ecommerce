const express = require("express");
const connectDB = require("./config/db");
require("dotenv").config();
const cors = require("cors");



//Importing Routes
const adminRoute = require("./routes/Admin-Routes/adminRoutes"); 
const branchRoute = require("./routes/Branch-Routes/branchRoutes");
const deliveryBoyRoute = require("./routes/Delivery-Routes/deliveryRoutes");
const bannerRoute = require("./routes/Banner-Routes/bannerRoutes");
const productRoute = require("./routes/Product-Routes/productRoutes");
const testimonialRoute = require("./routes/Testimonial-Routes/testimonialRoutes");
const branchAdminProductRoute = require("./routes/Branch-Routes/branchAdminProductRoutes");
const branchAdminDeliveryBoyRoute = require("./routes/Branch-Routes/branch-adminDeliveryBoyRoutes");

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Connect to Database
connectDB();


//Using Routes
app.use("/api/admin",adminRoute);
app.use("/api/branch", branchRoute);
app.use("/api/deliveryBoy", deliveryBoyRoute);
app.use("/api/banner", bannerRoute);
app.use("/api/products", productRoute);
app.use("/api/testimonial", testimonialRoute);
app.use("/api/branchAdmin", branchAdminProductRoute);
app.use("/api/branchAdmin", branchAdminDeliveryBoyRoute);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
