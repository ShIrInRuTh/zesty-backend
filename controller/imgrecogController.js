// controller/imgrecogController.js
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();

// CommonJS import for GenAI
const genAIModule = require("@google/genai");
const GoogleGenAI = genAIModule.GoogleGenAI;
const createUserContent = genAIModule.createUserContent;
const createPartFromUri = genAIModule.createPartFromUri;

const ALLOWED_CATEGORIES = [
  "All",
  "Protein",
  "Vegetable",
  "Dairy",
  "Fruit",
  "Sauces",
  "Dry-Ration",
];

// Initialize GenAI client
const aiClient = new GoogleGenAI({ apiKey: process.env.API_KEY_GEMINI });

async function imgrecoHandler(req, res) {
  try {
    const { imageUrl, mimeType } = req.body;

    if (!imageUrl || !mimeType || !imageUrl.startsWith("http")) {
      return res.status(400).json({
        error: "Invalid or missing 'imageUrl' or 'mimeType' in request body.",
      });
    }

    // 1️⃣ Download the image
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    const buffer = Buffer.from(response.data);

    // 2️⃣ Save it temporarily
    const tempPath = path.join(__dirname, `temp_${Date.now()}.jpg`);
    fs.writeFileSync(tempPath, buffer);

    // 3️⃣ Upload to GenAI
    const uploadedFile = await aiClient.files.upload({ file: tempPath });

    // 4️⃣ Construct prompt and contents
    const prompt = `Please identify the primary food item in the image and tell me what category it belongs to (choose from: ${ALLOWED_CATEGORIES.join(
      ", "
    )}). Return only a JSON object with keys "name" and "category".`;

    const contents = [
      createUserContent([
        prompt,
        createPartFromUri(uploadedFile.uri, mimeType),
      ]),
    ];

    // 5️⃣ Generate content
    const responseGen = await aiClient.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
    });

    let resultText = responseGen.text?.trim() || "{}";

    // 6️⃣ Strip backticks if Gemini wrapped response in ```json ... ```
    resultText = resultText.replace(/```(?:json)?\s*([\s\S]*?)\s*```/, "$1");

    // 7️⃣ Parse JSON safely
    let resultJson;
    try {
      resultJson = JSON.parse(resultText);
    } catch (parseErr) {
      console.warn("Failed to parse JSON response:", resultText);
      resultJson = { name: "unknown item", category: "All" };
    }

    // 8️⃣ Extract values and validate category (case-insensitive)
    let { name, category } = resultJson;
    name = name || "unknown item";
    category = category?.trim() || "All";

    // Case-insensitive match against allowed categories
    const matchedCategory = ALLOWED_CATEGORIES.find(
      (c) => c.toLowerCase() === category.toLowerCase()
    );
    category = matchedCategory || "All";

    // 9️⃣ Cleanup temp file
    fs.unlinkSync(tempPath);

    return res.status(200).json({ item: { name, category } });
  } catch (err) {
    console.error("imgreco error:", err.message || err);
    return res.status(500).json({
      error: "Image recognition failed",
      details: err.message || "An unknown error occurred.",
    });
  }
}

module.exports = { imgrecoHandler };
