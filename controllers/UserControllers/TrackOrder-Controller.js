const Order = require("../../models/UserModels/orderNow");


//getTrackingOrderDetails


const getTrackingOrderDetails = async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await Order.findById(orderId).populate("items.product", "productName price image quantity");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const item = order.items[0];
    const productData = item.product || {};
    const tracking = [];

    // ✅ Status labels in correct sequence
    const finalStatusLabels = {
      orderPlaced: "Order Placed",
      orderConfirmed: "Order Confirmed",
      confirmed: "Confirmed",
      inProcess: "In Process",
      packed: "Packed the Product",
      arrivedAtWarehouse: "Arrived in the Warehouse",
      nearCourierFacility: "Nearby Courier Facility",
      outForDelivery: "Out for Delivery",
      delivered: "Delivered"
    };

    // ✅ Normalize status label for comparison (replace getReadableStatus)
    const normalizeStatus = status => {
      const map = {
        "Order Placed": "Order Placed",
        "Order Confirmed": "Order Confirmed",
        "Confirmed": "Confirmed",
        "In Process": "In Process",
        "Packed the Product": "Packed the Product",
        "Arrived in the Warehouse": "Arrived in the Warehouse",
        "Nearby Courier Facility": "Nearby Courier Facility",
        "Out for Delivery": "Out for Delivery",
        "Delivered": "Delivered"
      };
      return map[status] || status;
    };

    // ✅ Build timeline based on current status
    let statusReached = false;

    for (const key of Object.keys(finalStatusLabels)) {
      const label = finalStatusLabels[key];
      const time = order.statusTimeline?.[key];

      if (time) {
        const d = new Date(time);
        const date = d.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          timeZone: 'UTC'
        });
        const formattedTime = d.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          timeZone: 'UTC'
        });

        tracking.push({
          status: label,
          date,
          time: formattedTime
        });
      }

      if (order.status === label || label === normalizeStatus(order.status)) {
        statusReached = true;
      }

      if (statusReached) break;
    }

    return res.status(200).json({
      success: true,
      message: "Order details fetched",
      data: {
        orderId: order._id,
        product: {
          name: productData?.productName || "Not Available",
          quantity: `${item.quantity} Pads`,
          price: productData.price || "Not Available",
          image: productData.image || "Not Available"
        },
        tracking
      }
    });

  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching order",
      error: error.message
    });
  }
};





//getOngoingTrackOrder

//Helperfunction for  status keys 
function getReadableStatus(status) {
  const map = {
    "Order Placed": "Order Placed",
    "Order Confirmed": "Order Confirmed",
    "Confirmed": "Confirmed",
    "In Process": "In Process",
    "Packed the Product": "Packed the Product",
    "Arrived in the Warehouse": "Arrived in the Warehouse",
    "Nearby Courier Facility": "Nearby Courier Facility",
    "Out for Delivery": "Out for Delivery",
    "Delivered": "Delivered"
  };
  return map[status] || status;
}

// 📌 Helper Function for date and time
function formatDateTime(date) {
  const d = new Date(date);
  return {
    date: d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC'
    }),
    time: d.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC'
    })
  };
}

const getOngoingTrackingOrder = async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await Order.findById(orderId).populate("items.product", "productName price image quantity");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const item = order.items[0];
    const productData = item.product || {};
    const tracking = [];

    // ✅ Final ordered statuses in correct sequence
    const finalStatusLabels = {
      orderPlaced: "Order Placed",
      orderConfirmed: "Order Confirmed",
      confirmed: "Confirmed",
      inProcess: "In Process",
      packed: "Packed the Product",
      arrivedAtWarehouse: "Arrived in the Warehouse",
      nearCourierFacility: "Nearby Courier Facility",
      outForDelivery: "Out for Delivery",
      delivered: "Delivered"
    };

    // Show statuses only till current order.status
    let statusReached = false;
    for (const key of Object.keys(finalStatusLabels)) {
      const label = finalStatusLabels[key];
      const time = order.statusTimeline?.[key];

      //  Stop showing further statuses if current one not reached
      if (time) {
        const formatted = formatDateTime(time);
        tracking.push({
          status: label,
          date: formatted.date,
          time: formatted.time
        });
      }

      // Stop after current main status
      if (order.status === label || label === getReadableStatus(order.status)) {
        statusReached = true;
      }

      if (statusReached) break;
    }

    return res.status(200).json({
      success: true,
      message: "Order details fetched",
      data: {
        orderId: order._id,
        product: {
          name: productData?.productName || "Not Available",
          quantity: `${item.quantity} Pads`,
          price: productData.price || "Not Available",
          image: productData.image || "Not Available"
        },
        tracking
      }
    });

  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching order",
      error: error.message
    });
  }
};


  module.exports = {
    getTrackingOrderDetails,
   
  }