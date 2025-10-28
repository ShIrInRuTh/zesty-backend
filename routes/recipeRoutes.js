const express = require("express");
const router = express.Router();

const { talkToAI, speechToText } = require("../controller/recipeController");

router.post("/talk", talkToAI);
router.post("/transcribe", speechToText);

module.exports = router;
