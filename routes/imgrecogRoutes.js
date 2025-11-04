const express = require("express");
const router = express.Router();
const { imgrecoHandler } = require("../controller/imgrecogController"); // point to your controller file

// POST /api/imgreco
router.post("/", imgrecoHandler);

module.exports = router;
