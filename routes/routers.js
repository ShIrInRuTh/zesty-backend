const express = require("express");
const router = express.Router();

const authRoutes = require("./authRoutes");
const recipeRoutes = require("./recipeRoutes");
const fridgeRoutes = require("./fridgeRoutes")

router.use("/fridge", fridgeRoutes);


// Mount auth routes at /api/auth (if have any)
router.use("/auth", authRoutes);
router.use("/recipe", recipeRoutes);
// Healthcheck route at /api/healthcheck
router.get("/healthcheck", (req, res) => {
  res.status(200).send({ status: "ok" });
});

module.exports = router;
