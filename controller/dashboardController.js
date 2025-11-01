const DashboardModel = require('../model/dashboardModel.js');

const getDashboardData = async (req, res) => {
  try {
    // Your 'checkAuth' middleware attaches the user object to req.user
    const userId = req.user.id; // <-- This is the only change you need

    if (!userId) {
      return res.status(400).json({ message: 'User ID not found in request.' });
    }

    // Call the model function to get all data
    const dashboardData = await DashboardModel.getDashboardDetails(userId);

    res.status(200).json(dashboardData);

  } catch (error) {
    console.error('Error in getDashboardData controller:', error.message);
    res.status(500).json({ message: 'Server error fetching dashboard data', error: error.message });
  }
};

// 3. Use 'module.exports' instead of 'export'
module.exports = {
  getDashboardData
};