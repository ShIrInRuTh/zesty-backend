const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");
const { AssemblyAI } = require("assemblyai");

const client = new AssemblyAI({ apiKey: process.env.API_KEY_ASSEMBLY });

const genAI = new GoogleGenerativeAI(process.env.API_KEY_GEMINI);

async function urlToGenerativePart(url) {
  try {
    const response = await axios.get(url, { 
        responseType: 'arraybuffer',
        timeout: 10000 
    });
    
    const contentType = response.headers['content-type']; 
    const base64Data = Buffer.from(response.data).toString('base64');

    return {
      inlineData: {
        data: base64Data,
        mimeType: contentType,
      },
    };
  } catch (error) {
    if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      throw new Error("Image download failed: Timeout after 10 seconds.");
    }
    throw new Error(`Failed to download image from URL: ${error.message}`);
  }
}

const imgreco = async (req, res) => {
  const imgUrl = req.body.img;

  if (!imgUrl) {
      return res.status(400).json({ error: "Missing 'img' URL in request body." });
  }

  try {
    // 1. Prepare the image
    const imagePart = await urlToGenerativePart(imgUrl);

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // 2. Define the prompt and configuration to force reliable JSON output
    const prompt = [
        imagePart, 
        { text: "Analyze the image. Identify the main ingredient. Return *only* a JSON object with two keys: 'name' and 'category'. Category must be strictly one of: ['protein', 'vegetable', 'dairy', 'fruit', 'sauces', 'dry-ration']." }
    ];

    const result = await model.generateContent({
        contents: prompt,
        config: {
            // Forces the model to generate a valid JSON object
            responseMimeType: "application/json",
            responseSchema: {
                type: "object",
                properties: {
                    name: { type: "string" },
                    category: { type: "string" }
                },
                required: ["name", "category"]
            }
        }
    });

    // 3. Process the output
    const rawJsonText = result.response.text.trim();
    let jsonItem;

    try {
        // The forced JSON output should be clean
        jsonItem = JSON.parse(rawJsonText); 
    } catch (e) {
        // Fallback for unexpected parsing issues
        console.error("Critical parsing error from Gemini model:", e.message, "Raw Text:", rawJsonText);
        return res.status(500).json({ 
            error: "AI returned unparseable data. Check server logs.", 
            raw_response: rawJsonText 
        });
    }

    res.status(200).json({ item: jsonItem });

  } catch (error) {
    console.error("Error in imgRecog:", error.message);
    res.status(500).json({ error: `Image recognition failed: ${error.message}` });
  }
};

module.exports = imgreco;
