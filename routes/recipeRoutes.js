const express = require("express");
const router = express.Router();

const {
  talkToAI,
  speechToText,
  generateRecpies,
  likeRecipe,
  getUserLikedRecipes,
  unlikeRecipe,
  getUserInProgressRecipes,
  getUserCompletedRecipes,
  startRecipe,
  findRecipeById,
} = require("../controller/recipeController");

router.post("/", generateRecpies);
router.post("/talk", talkToAI);
router.post("/transcribe", speechToText);
router.post("/like", likeRecipe);
router.get("/like/:user_id/:fridge_id", getUserLikedRecipes);
router.put("/like", unlikeRecipe);
router.get("/history/inProgress/:user_id/:fridge_id", getUserInProgressRecipes);
router.get("/history/completed/:user_id/:fridge_id", getUserCompletedRecipes);
router.post("/new", startRecipe);
router.get("/findRecipe/:id", findRecipeById);

module.exports = router;
