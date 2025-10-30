require("dotenv").config();
const {fetchFridgeItems, fetchNumberofItems} = require("../model/fridgeModel");

const fridgetest = async (req, res) => {
    try {
        const id = req.params.id
        const cat = req.body.cat.toLowerCase() || ''
        // console.log(cat)
        const msg = await fetchFridgeItems(id,cat); // ✅ await the async function
        const catNum = await fetchNumberofItems(id)
        res.status(200).json({ message: msg, cat: catNum });  
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};



module.exports = fridgetest;

// res.status(200).json({ message: msg });   SWAP IF NOT WORKING