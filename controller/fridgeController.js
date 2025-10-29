require("dotenv").config();
const fetchFridgeItems = require("../model/fridgeModel");

const fridgetest = async (req, res) => {
    try {
        const id = req.params.id
        const msg = await fetchFridgeItems(id); // ✅ await the async function
        res.status(200).json({ message: msg });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = fridgetest;