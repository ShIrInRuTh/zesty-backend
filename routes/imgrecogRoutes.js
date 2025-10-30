const express = require("express");
const router = express.Router();
const imgreco = require("../controller/imgrecogController"); // point to your controller file

// POST /api/imgreco
router.post("/", imgreco);

module.exports = router;
