 const userModel = require("../../models/UserModels/User");
const deliveryBoyModel = require("../../models/SuperAdminModels/DeliveryBoy");
const branchModel = require("../../models/SuperAdminModels/branch");
const Order = require("../../models/UserModels/orderNow");



//getTotalBranches
const getAllBranches = async (req, res) => {
  try {
    const totalBranches = await branchModel.countDocuments();
    return res.status(200).json({ totalBranches });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error", success: false, error: error.message });
  }
};
 
//getTotalDelieveryBoys
const getAllDelieveryBoys = async (req, res) => {
  try {
    const totalDelieveryBoys = await deliveryBoyModel.countDocuments();
    return res.status(200).json({ totalDelieveryBoys });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error", success: false, error: error.message });
  }
};
 
//getAllCustomers
const getAllCustomers = async (req, res) => {
  try {
    const totalCustomers = await userModel.countDocuments();
    return res.status(200).json({ totalCustomers });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error", success: false, error: error.message });
  }
};
 
//get All Orders
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.countDocuments();
    return res.status(200).json({ orders });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error", success: false, error: error.message });
  }
};
 
 
// //getYearDropdownData
// const getYearDropdownData = async (req, res) => {
//   try {
//     const years = [];
//     for (let year = 2000; year <= 2030; year++) {
//       years.push(year);
//     }
//     return res.status(201).json({ years });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({ message: "Internal Server Error", success: false, error: error.message });
//   }
// };
 
//getBranchNameDropdownData
const getAllBranchesDropdown = async (req, res) => {
  try {
    const branches = await branchModel.find({}, { branchName: 1, _id: 0 });
    const branchNames = branches.map((branch) => branch.branchName);
 
    return res.status(201).json({ branchNames });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error", success: false, error: error.message });
  }
};
 
//getBranchOverview
const getBranchOverview = async (req, res) => {
    try {
      const { year, branchName } = req.query;
      const selectedYear = parseInt(year) || new Date().getFullYear();
  
      const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
      ];
  
      const startDate = new Date(`${selectedYear}-01-01`);
      const endDate = new Date(`${selectedYear + 1}-01-01`);
  
      let deliveries = await deliveryBoyModel.find({
        createdAt: { $gte: startDate, $lt: endDate }
      }).populate("branchInfo");
  
      if (branchName) {
        deliveries = deliveries.filter(d => d.branchInfo?.branchName === branchName);
      }
  
      let orders = await Order.find({
        orderDate: { $gte: startDate, $lt: endDate } 
      }).populate("branchInfo");
  
      if (branchName) {
        orders = orders.filter(o => o.branchInfo?.branchName === branchName);
      }
  
      console.log("Orders count after filter:", orders.length);
  
      let customers = await userModel.find({
        createdAt: { $gte: startDate, $lt: endDate }
      }).populate("branchInfo");
  
      if (branchName) {
        customers = customers.filter(c => c.branchInfo?.branchName === branchName);
      }
  
      const report = months.map((month, index) => {
        const totalDelivery = deliveries.filter(d =>
          new Date(d.createdAt).getUTCMonth() === index
        ).length;
  
        const totalOrder = orders.filter(o =>
          new Date(o.orderDate).getUTCMonth() === index
        ).length;
  
        const totalCustomer = customers.filter(c =>
          new Date(c.createdAt).getUTCMonth() === index
        ).length;
  
        return {
          month,
          totalDelivery,
          totalOrder,
          totalCustomer
        };
      });
  
      return res.status(200).json({
        success: true,
        report
      });
  
    } catch (error) {
      console.error("Error generating branch overview:", error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  };
  
  //getDeliveryReport
  const getDeliveryReport = async (req, res) => {
    try {
      const { year, branchName } = req.query;
      const selectedYear = parseInt(year) || new Date().getFullYear();
  
      const startDate = new Date(`${selectedYear}-01-01`);
      const endDate = new Date(`${selectedYear + 1}-01-01`);
  
      let deliveries = await deliveryBoyModel.find({
        createdAt: { $gte: startDate, $lt: endDate }
      }).populate("branchInfo");
  
      if (branchName) {
        deliveries = deliveries.filter(d => d.branchInfo?.branchName === branchName);
      }
  
      const monthlyCount = new Array(12).fill(0);
      deliveries.forEach(delivery => {
        const monthIndex = new Date(delivery.createdAt).getMonth(); 
        monthlyCount[monthIndex]++;
      });
  
      const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
      ];
  
      const report = months.map((month, index) => ({
        month,
        totalDelivery: monthlyCount[index]
      }));
  
      res.status(200).json({
        success: true,
        report
      });
  
    } catch (error) {
      console.error("Error fetching delivery report:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  };
  
  //getIncomeOverview
  const getIncomeOverview = async (req, res) => {
    try {
      const { branchName } = req.query;
  
      const today = new Date();
      const dayOfWeek = today.getDay();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - dayOfWeek);
      startOfWeek.setHours(0, 0, 0, 0);
  
      const dayMap = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
      const incomeData = [];
  
      for (let i = 0; i <= 7; i++) {
        const dayStart = new Date(startOfWeek);
        dayStart.setDate(startOfWeek.getDate() + i);
        dayStart.setHours(0, 0, 0, 0);
  
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayStart.getDate() + 1);
        dayEnd.setHours(0, 0, 0, 0);
  
        let orders = await Order.find({
          orderDate: { $gte: dayStart, $lt: dayEnd }
        }).populate("branchInfo");
  
        if (branchName) {
          orders = orders.filter(order =>
            order.branchInfo?.branchName === branchName
          );
        }
  
        const total = orders.reduce((acc, order) => acc + (order.totalAmount || 0), 0);
  
        incomeData.push({
          day: dayMap[i],
          income: total
        });
      }
  
      const totalIncome = incomeData.reduce((acc, curr) => acc + curr.income, 0);
  
      res.status(200).json({
        totalIncome,
        incomeData
      });
  
    } catch (error) {
      console.error("Income overview error:", error);
      res.status(500).json({ message: "Server error" });
    }
  };
  
  
module.exports = {
  getAllBranches,
  getAllDelieveryBoys,
  getAllCustomers,
  getAllOrders,
  // getYearDropdownData,
  getAllBranchesDropdown,
  getDeliveryReport,
  getBranchOverview,
  getIncomeOverview
};