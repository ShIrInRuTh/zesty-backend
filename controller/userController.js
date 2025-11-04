const {
  getUserById,
  updateUserProfile,
  updateUserPassword,
  updateUserAvatar,
  deleteUserAndFridge,
} = require("../model/userModel");

const getUserByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await getUserById(id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json(user);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateProfileController = async (req, res) => {
  try {
    const { user_id, name, email } = req.body;
    if (!user_id) return res.status(400).json({ error: "Missing user_id" });
    const updated = await updateUserProfile(user_id, { username: name, email });
    res.status(200).json({ message: "Profile updated", user: updated });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updatePasswordController = async (req, res) => {
  try {
    const { user_id, current_password, new_password } = req.body;
    if (!user_id || !new_password) return res.status(400).json({ error: "Missing params" });
    const ok = await updateUserPassword(user_id, current_password, new_password);
    if (!ok) return res.status(401).json({ error: "Current password incorrect" });
    res.status(200).json({ message: "Password updated" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateAvatarController = async (req, res) => {
  try {
    const { user_id, image_url } = req.body;
    if (!user_id || !image_url) return res.status(400).json({ error: "Missing params" });
    const updated = await updateUserAvatar(user_id, image_url);
    res.status(200).json({ message: "Avatar updated", user: updated });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteUserController = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteUserAndFridge(id);
    res.status(200).json({ message: "User deleted" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  getUserByIdController,
  updateProfileController,
  updatePasswordController,
  updateAvatarController,
  deleteUserController,
};


