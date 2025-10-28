const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");
const { AssemblyAI } = require("assemblyai");

const client = new AssemblyAI({ apiKey: process.env.API_KEY_ASSEMBLY });

const genAI = new GoogleGenerativeAI(process.env.API_KEY_GEMINI);

const talkToAI = async (req, res) => {
  try {
    const body = req.body;
    console.log(body);

    // Extract and format ingredient details with nutritional values
    const formattedIngredients = body.ingredients
      .map(
        (ingredient) =>
          `- ${ingredient.name}: ${ingredient.portion} | Calories: ${ingredient.calories} | Proteins: ${ingredient.proteins}g | Fats: ${ingredient.fats}g | Carbohydrates: ${ingredient.carbohydrates}g`
      )
      .join("\n");

    // System prompt to guide the AI's behavior
    const systemPrompt = `
You are a professional cooking mentor bot. Your role is to assist users with their cooking questions based on the provided recipe and its instructions. Follow these guidelines strictly:

1. **Recipe Context**: Always use the recipe name, ingredients, nutritional values, and instructions as the foundation for your responses. If the user's question is unrelated to the recipe, politely guide them back to the recipe context.

2. **Clarity and Accuracy**: Provide clear, concise, and accurate answers. Avoid vague or open-ended responses.

3. **Flexibility**: If the user asks about ingredient substitutions, additions, or variations, offer practical suggestions that complement the dish. Emphasize that the recipe is a foundation, and it's okay to experiment.

4. **Handling Ambiguity**: If the recipe instructions are unclear (e.g., "use the amount on your packaging label"), provide standard measurements or practical recommendations based on common cooking practices.

5. **Nutritional Information**: Use the provided nutritional values (calories, proteins, fats, etc.) to answer questions about the recipe's health benefits, portion sizes, or dietary considerations. When discussing nutrition, explain the values in a conversational and meaningful way. For example:
   - Instead of saying "Calories: 428," say "This recipe has about 428 calories, making it a balanced meal."
   - Instead of listing numbers, interpret what they mean for the user (e.g., "The salmon and egg provide a good amount of protein, which is great for muscle repair and energy.").

6. **Professional Tone**: Maintain a smart, professional, and helpful tone in all responses. Avoid robotic language and make the conversation feel natural.

Here is the recipe context:
- **Recipe Name**: ${body.title}
- **Ingredients and Nutritional Values**:
${formattedIngredients}
- **Instructions**: ${body.instructions.join("\n")}
`;

    // User prompt containing the question
    const prompt = `
User Question: ${body.userQuestion}
`;

    // Initialize the Gemini model
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt,
    });

    console.log("Recipe Name:", body.recipeName);
    console.log("Instructions:", body.instructions);
    console.log("User Question:", body.userQuestion);

    // Generate the response
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    console.log("AI Response:", response);

    // Send the response back to the client
    res.status(200).json({ response });
  } catch (error) {
    console.error("Error in talkToAI:", error);
    res
      .status(500)
      .json({ error: "Failed to process your question. Please try again." });
  }
};

// Helper function to upload audio buffer to AssemblyAI (returns URL string)
async function uploadAudioFile(buffer) {
  const response = await axios.post(
    "https://api.assemblyai.com/v2/upload",
    buffer,
    {
      headers: {
        authorization: process.env.API_KEY_ASSEMBLY,
        "content-type": "application/octet-stream",
      },
    }
  );
  return response.data.upload_url;
}

const speechToText = async (req, res) => {
  try {
    const { base64Audio, mimeType } = req.body;

    if (!base64Audio || !mimeType) {
      return res
        .status(400)
        .json({ error: "base64Audio and mimeType required" });
    }

    // Convert base64 string to Buffer
    const audioBuffer = Buffer.from(base64Audio, "base64");

    // Upload buffer to AssemblyAI and get the audio URL string
    const uploadUrl = await uploadAudioFile(audioBuffer);

    // Send transcription request with the audio URL
    const transcript = await client.transcripts.transcribe({
      audio_url: uploadUrl, // Pass the URL string here
      speech_model: "universal",
    });

    // (Optional: poll or wait for completion here, if needed)

    res.json({ text: transcript.text });
  } catch (err) {
    console.error("Transcription error:", err);
    res
      .status(500)
      .json({ error: "Transcription failed", details: err.message });
  }
};

module.exports = {
  talkToAI,
  speechToText,
};
