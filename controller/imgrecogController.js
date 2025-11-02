const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");





const imgreco = async (req, res) => {
  const imgUrl = req.body.img;

  if (!imgUrl) return res.status(400).json({ error: "Missing 'img' URL in request body." });

  try {
    const response = await axios({
      method: "POST",
      url: "https://api-inference.huggingface.co/models/prithivMLmods/Food-101-93M",
      headers: {
        Authorization: `Bearer ${process.env.API_KEY_HUGGGINGFACE}`,
      },
      data: { inputs: imgUrl },
    });

    const predictions = response.data;
    const topPrediction = predictions[0] || { label: "Unknown", score: 0 };

    // Wrap output to match frontend expectations
    res.status(200).json({
      item: {
        name: topPrediction.label || "Unknown",
        category: "Unknown"  // placeholder
      },
    });

  } catch (error) {
    console.error("Hugging Face error:", error.response?.data || error.message);
    res.status(500).json({
      error: "Image recognition failed",
      details: error.response?.data || error.message,
    });
  }
};

module.exports = imgreco;


