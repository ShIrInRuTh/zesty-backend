const express = require("express");
const router = express.Router();

const test= require("../controller/fridgeController");

router.get("/:id", test)

module.exports = router;