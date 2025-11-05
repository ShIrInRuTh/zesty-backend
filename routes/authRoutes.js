const express = require("express");
const router = express.Router();

const { test, login, signUp } = require("../controller/authController");

router.get("/", test);
router.post("/login", login);
router.post("/signup", signUp);

module.exports = router;
