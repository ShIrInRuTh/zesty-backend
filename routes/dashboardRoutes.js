const express = require("express");
const router = express.Router();

const { getDashboardData } = require("../controller/dashboard.controller.js");

// 1. Import your 'checkAuth' function from your 'auth.js' file
const checkAuth = require('../middleware/auth.js'); // <-- Use your file

// 2. Use 'checkAuth' in the route
router.get("/", checkAuth, getDashboardData);

module.exports = router;