const express = require("express");
const router = express.Router();

const authRoutes = require("./authRoutes");
const recipeRoutes = require("./recipeRoutes");
const fridgeRoutes = require("./fridgeRoutes")
const imgrecoRoutes = require("./imgrecogRoutes");
const userRoutes = require("./userRoutes");

router.use("/fridge", fridgeRoutes);


// Mount auth routes at /api/auth (if have any)
router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/recipe", recipeRoutes);
router.use("/imgreco", imgrecoRoutes);
// Healthcheck route at /api/healthcheck
router.get("/healthcheck", (req, res) => {
  res.status(200).send({ status: "ok" });
});

module.exports = router;

