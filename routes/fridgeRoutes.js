const express = require("express");
const router = express.Router();

const test= require("../controller/fridgeController");

router.post("/:id", test)

module.exports = router;