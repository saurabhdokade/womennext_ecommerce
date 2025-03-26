const express = require("express");
const connectDB = require("./config/db");
require("dotenv").config();
const cors = require("cors");



//Importing Routes
const adminRoute = require("./routes/adminRoutes"); 
const branchRoute = require("./routes/branchRoutes");
const deliveryBoyRoute = require("./routes/deliveryRoutes");
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Connect to Database
connectDB();


//Using Routes
app.use("/api/admin", adminRoute);
app.use("/api/branch", branchRoute);
app.use("/api/deliveryBoy", deliveryBoyRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
