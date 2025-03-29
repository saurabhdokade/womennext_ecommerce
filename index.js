const express = require("express");
const connectDB = require("./config/db");
require("dotenv").config();
const cors = require("cors");



//Importing All Adim Related Routes
const adminRoute = require("./routes/SuperAdmin-Routes/Super-AdminRoutes"); 
const branchRoute = require("./routes/SuperAdmin-Routes/branchRoutes");
const deliveryBoyRoute = require("./routes/SuperAdmin-Routes/deliveryRoutes");
const bannerRoute = require("./routes/SuperAdmin-Routes/bannerRoutes");
const productRoute = require("./routes/SuperAdmin-Routes/productRoutes");
const testimonialRoute = require("./routes/SuperAdmin-Routes/testimonialRoutes");
const settingsRoute = require("./routes/SuperAdmin-Routes/SettingRoutes");
const customerRoute = require("./routes/SuperAdmin-Routes/customerRoutes");






//Importing All Branch Admin Related Routes
const branchAdminRoute = require("./routes/BranchAdmin-Routes/branchAdminRoutes");
const branchAdminProductRoute = require("./routes/BranchAdmin-Routes/branchAdminProductRoutes");
const branchAdminDeliveryBoyRoute = require("./routes/BranchAdmin-Routes/branch-adminDeliveryBoyRoutes");

//Importing All User Related Routes
const userRoute = require("./routes/user-Routes/useRoutes");

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Connect to Database
connectDB();


//Super Admin  Routes
app.use("/api/superAdmin",adminRoute);
app.use("/api/branch", branchRoute);
app.use("/api/deliveryBoy", deliveryBoyRoute);
app.use("/api/banner", bannerRoute);
app.use("/api/products", productRoute);
app.use("/api/testimonial", testimonialRoute);
app.use("/api/customer", customerRoute);

//Branch Admin Routes
app.use("/api/branchAdmin", branchAdminRoute);
app.use("/api/branchAdminProduct", branchAdminProductRoute);
app.use("/api/branchAdminDeliveryBoy", branchAdminDeliveryBoyRoute);
app.use("/api/settings", settingsRoute);

//User Routes
app.use("/api/user", userRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
