const express = require("express");
const router = express.Router();

const {
  getUserByIdController,
  updateProfileController,
  updatePasswordController,
  updateAvatarController,
  deleteUserController,
} = require("../controller/userController");

router.get("/:id", getUserByIdController);
router.put("/profile", updateProfileController);
router.put("/password", updatePasswordController);
router.put("/avatar", updateAvatarController);
router.delete("/:id", deleteUserController);

module.exports = router;
