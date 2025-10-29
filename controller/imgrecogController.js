const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");
const { AssemblyAI } = require("assemblyai");

const client = new AssemblyAI({ apiKey: process.env.API_KEY_ASSEMBLY });

const genAI = new GoogleGenerativeAI(process.env.API_KEY_GEMINI);

const imgreco = async (req, res) => {
  const imgUrl = req.body.img;

  try {
    const imgPrompt = `Your job is to recoginise the ingredient in the image and return its name and category.Categorise the ingredient into one of these categories ['Protein', 'Vegetable', 'Dairy', 'Fruit', 'Sauces', 'Dry-Ration']. The image is here ${imgUrl}`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: imgPrompt,
    });
    const result = await model.generateContent(prompt);
    res.status(200).json({ item: result.response });
  } catch (error) {
    console.error("Error in imgPrompt", error);
    res.status(500).json({ error: "Failed imgRecog, Please try again" });
  }
};

module.exports = imgreco;
