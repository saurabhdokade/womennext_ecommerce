const express = require("express");
const connectDB = require("./config/db");
require("dotenv").config();
const cors = require("cors");



//Importing All Adim Related Routes
const adminRoutes = require("./routes/SuperAdmin-Routes/Super-AdminRoutes"); 
const branchRoutes = require("./routes/SuperAdmin-Routes/branchRoutes");
const deliveryBoyRoutes = require("./routes/SuperAdmin-Routes/deliveryRoutes");
const bannerRoutes = require("./routes/SuperAdmin-Routes/bannerRoutes");
const productRoutes = require("./routes/SuperAdmin-Routes/productRoutes");
const testimonialRoutes = require("./routes/SuperAdmin-Routes/testimonialRoutes");
const settingsRoutes = require("./routes/SuperAdmin-Routes/SettingRoutes");
const customerRoutes = require("./routes/SuperAdmin-Routes/customerRoutes");
const superAdminOrderRoutes = require("./routes/SuperAdmin-Routes/superAdminOrderRoutes");






//Importing All Branch Admin Related Routes
const branchAdminRoutes = require("./routes/BranchAdmin-Routes/branchAdminRoutes");
const branchAdminProductRoutes = require("./routes/BranchAdmin-Routes/branchAdminProductRoutes");
const branchAdminDeliveryBoyRoutes = require("./routes/BranchAdmin-Routes/branch-adminDeliveryBoyRoutes");
const branchSettingsRoutes = require("./routes/BranchAdmin-Routes/branchSettingsRoutes");



//Importing All User Related Routes
const userRoutes = require("./routes/user-Routes/useRoutes");
const userProductRoutes = require("./routes/user-Routes/userProductRoutes");
const cartRoutes = require("./routes/user-Routes/CartRoutes");
const userOrderRoutes = require("./routes/user-Routes/orderNow-Routes");
const contactRoutes = require("./routes/user-Routes/conatctUs-Routes");
const reviewRoutes = require("./routes/user-Routes/reviewRoutes");
const userSettingsRoutes = require("./routes/user-Routes/userSettingsRoutes");

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Connect to Database
connectDB();


//Super Admin  Routes
app.use("/api/superAdmin",adminRoutes);
app.use("/api/branch", branchRoutes);
app.use("/api/deliveryBoy", deliveryBoyRoutes);
app.use("/api/banner", bannerRoutes);
app.use("/api/products", productRoutes);
app.use("/api/testimonial", testimonialRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/order", superAdminOrderRoutes);


//Branch Admin Routes
app.use("/api/branchAdmin", branchAdminRoutes);
app.use("/api/branchAdminProduct", branchAdminProductRoutes);
app.use("/api/branchAdminDeliveryBoy", branchAdminDeliveryBoyRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/branchSettings", branchSettingsRoutes);

//User Routes
app.use("/api/user", userRoutes);
app.use("/api/user/Product", userProductRoutes);
app.use("/api/user", cartRoutes);
app.use("/api/user", userOrderRoutes);
app.use("/api/user", contactRoutes);
app.use("/api/user/review", reviewRoutes);
app.use("/api/user/settings", userSettingsRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
