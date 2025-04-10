const userModel = require("../../models/UserModels/User");
const deliveryModel = require("../../models/SuperAdminModels/DeliveryBoy");
const branchModel = require("../../models/SuperAdminModels/branch");
const Order = require("../../models/UserModels/orderNow");
 
//getTotalBranches
const getAllBranchesCount = async (req, res) => {
  try {
    const totalBranches = await branchModel.countDocuments();
    return res.status(200).json({ totalBranches });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({
        message: "Internal Server Error",
        success: false,
        error: error.message,
      });
  }
};
 
//getTotalDelieveryBoys
const getAllDelieveryBoysCount = async (req, res) => {
  try {
    const totalDelieveryBoys = await deliveryModel.countDocuments();
    return res.status(200).json({ totalDelieveryBoys });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({
        message: "Internal Server Error",
        success: false,
        error: error.message,
      });
  }
};
 
//getAllCustomers
const getAllCustomersCount = async (req, res) => {
  try {
    const totalCustomers = await userModel.countDocuments();
    return res.status(200).json({ totalCustomers });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({
        message: "Internal Server Error",
        success: false,
        error: error.message,
      });
  }
};
 
//get All Orders
const getAllOrdersCount = async (req, res) => {
  try {
    const orders = await Order.countDocuments();
    return res.status(200).json({ orders });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({
        message: "Internal Server Error",
        success: false,
        error: error.message,
      });
  }
};
 

 
//getBranchNameDropdownData
const getAllBranchesDropdown = async (req, res) => {
  try {
    const branches = await branchModel.find({}, { branchName: 1, _id: 0 });
    const branchNames = branches.map((branch) => branch.branchName);
 
    return res.status(201).json({ branchNames });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({
        message: "Internal Server Error",
        success: false,
        error: error.message,
      });
  }
};
 
//getBranchOverviewGraphData
const getBranchOverview = async (req, res) => {
  const { year, branch } = req.query;
 
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const overview = [];
 
  for (let i = 0; i < 12; i++) {
    // Get start and end date of the month
    const startDate = new Date(year, i, 1);
    const endDate = new Date(year, i + 1, 0);
 
    const totalCustomer = await userModel.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
      branch: branch,
    });
 
    const totalDeliveryBoy = await deliveryModel.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
      branch: branch,
    });
 
    const totalOrder = await Order.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
      branch: branch,
    });
 
    overview.push({
      month: months[i],
      totalCustomer,
      totalDeliveryBoy,
      totalOrder,
    });
  }
 
  return res.status(200).json({ success: true, overview });
};
 
//getDelieveryReport
const getDeliveryReport = async (req, res) => {
  const { year, branch } = req.query;
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const report = [];
 
  for (let i = 0; i < 12; i++) {
    const startDate = new Date(year, i, 1);
    const endDate = new Date(year, i + 1, 0);
 
    const totalDelivery = await Order.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
      branch: branch,
      status: "Delivered", // optional filter if you store status
    });
 
    report.push({
      month: months[i],
      totalDelivery,
    });
  }
 
  return res.status(200).json({ success: true, report });
};
 
//getIncomeOverview
const getIncomeOverview = async (req, res) => {
  const { branch } = req.query;
 
  // Get start and end of this week (Monday to Sunday)
  const now = new Date();
  const day = now.getDay(); // Sunday=0, Monday=1,...Saturday=6
  const diffToMonday = (day === 0 ? -6 : 1) - day;
 
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + diffToMonday);
  weekStart.setHours(0, 0, 0, 0);
 
  const weekData = [];
 
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(weekStart);
    currentDate.setDate(weekStart.getDate() + i);
 
    const nextDate = new Date(currentDate);
    nextDate.setDate(currentDate.getDate() + 1);
 
    const income = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: currentDate, $lt: nextDate },
          branch: branch,
          status: "delivered", // if needed
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" }, // assuming "totalAmount" in order model
        },
      },
    ]);
 
    const total = income.length > 0 ? income[0].total : 0;
 
    const weekdays = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
    weekData.push({
      day: weekdays[i],
      income: total,
    });
  }
 
  const totalIncome = weekData.reduce((acc, curr) => acc + curr.income, 0);
 
  res.status(200).json({
    success: true,
    totalIncome,
    incomeData: weekData,
  });
};
 
module.exports = {
  getAllBranchesCount,
  getAllDelieveryBoysCount,
  getAllCustomersCount,
  getAllOrdersCount,

  getAllBranchesDropdown,
  getDeliveryReport,
  getBranchOverview,
  getIncomeOverview,
};