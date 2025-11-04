require("dotenv").config();
const { healthCheck } = require("../model/healthModel");
const { loginUser, addUser } = require("../model/userModel");
const jwt = require("jsonwebtoken");

const test = async (req, res) => {
  try {
    const msg = await healthCheck(); // ✅ await the async function
    res.status(200).json({ message: msg });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await loginUser(email, password);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    } else {
      const token = jwt.sign(
        { userId: user.id, fridgeId: user.fridge_id || null },
        process.env.JWT_SECRET,
        { expiresIn: "2h" }
      );

      res.status(200).json({
        message: "Login successful",
        token: `Bearer ${token}`,
        user: {
          id: user.user_id,
          email: user.email,
          fridge_id: user.fridge_id,
        },
      });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const signUp = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = await addUser(name, email, password);
    res.status(201).json({
      message: "User added",
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { test, login, signUp };
