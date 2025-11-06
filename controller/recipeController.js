const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");
const { AssemblyAI } = require("assemblyai");
const {
  getExpiringItems,
  addLikedRecipes,
  getLikedRecipes,
  removeFromLikedRecipes,
  getRecipe,
  likeARecipe,
  getInProgressRecipes,
  getCompletedRecipes,
  addRecipe,
  getRecipeById,
} = require("../model/recipeModel");

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

const generateRecpies = async (req, res) => {
  const body = req.body;

  try {
    // Get expiring ingredients from fridge
    const ingredients = await getExpiringItems(body.fridgeId);

    // === System prompt with new rules ===
    const systemPrompt = `
Your job is to generate ${body.numRecipe} ${
      body.numRecipe > 1 ? "different recipes" : "recipe"
    } based on the user's requirements.

Rules for expiring ingredients:
1. Each recipe **must use at least 1 expiring ingredient** from the list provided.
2. At least 1/8 of the recipes (round up if necessary) must include **all of the expiring ingredients**.
3. You may include additional non-expiring pantry ingredients to complete the recipe.

Each recipe must be **human-edible and realistic**.

Each recipe must have:
- A descriptive "title"
- Properly listed "ingredients_list"
- "instructions" as step-by-step numbered strings
- "total_calories"
- "notes"
- A valid "image_url" (choose from this safe list):
  - Breakfast: https://images.unsplash.com/photo-1504754524776-8f4f37790ca0
  - Lunch:  https://images.unsplash.com/photo-1504674900247-0877df9cc836
  - Dinner: https://images.unsplash.com/photo-1547573854-74d2a71d0826?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2340
  - Dessert: https://plus.unsplash.com/premium_photo-1754254888211-288bc6e74b38?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2340
  - Healthy: https://images.unsplash.com/photo-1494390248081-4e521a5940db?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2006
  - Default: https://images.unsplash.com/photo-1625467150295-8eadf10ea64d?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2338

**Important:** Assign the most appropriate image to each recipe. If unsure, use the default.

Output a valid JSON array (no markdown, no extra text) in this format:
[{
  "id": <integer>,
  "title": <string>,
  "yields": <string>,
  "prepTime": <string>,
  "cookTime": <string>,
  "ingredients_list": [
    { "name": <string>, "portion": <string> }
  ],
  "expiring_ingredients_used": [
    <string>
  ],
  "instructions": [
    "1. Step one",
    "2. Step two"
  ],
  "notes": <string>,
  "total_calories": "<string>",
  "image_url": "<string>"
}]

Always return a valid JSON array — even if there’s only one recipe.
`;

    // === User prompt ===
    const prompt = `
Generate **${body.numRecipe} ${
      body.numRecipe > 1 ? "different recipes" : "recipe"
    }** for **${body.serving} serving${
      body.serving > 1 ? "s" : ""
    }** with the following details:

- **Expiring Ingredients:** ${
      ingredients && ingredients.length > 0
        ? ingredients.map((i) => i.item_name).join(", ")
        : "None"
    }
- **Meal Type:** ${body.mealType || "Any"}
- **Cooking Method:** ${body.cookingMethod || "Any"}
- **Dietary Preferences:**
   - Vegan: ${body.vegan ? "Yes" : "No"}
   - Halal: ${body.halal ? "Yes" : "No"}
   - Allergy Info: ${body.allergy || "None"}
- **Additional Instructions:** ${body.instructions || "None"}
`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt,
    });

    console.log("Request body:", body);
    console.log("System prompt:", systemPrompt);
    console.log("Prompt:", prompt);

    // === Call AI model ===
    const result = await model.generateContent(prompt);
    const rawText = await result.response.text();

    console.log("Raw AI response:", rawText);

    // === Clean JSON ===
    const cleanedText = rawText
      .replace(/^```json\s*/i, "")
      .replace(/```$/m, "")
      .trim();

    let recipes;
    try {
      recipes = JSON.parse(cleanedText);
    } catch (e) {
      console.error("Failed to parse AI JSON:", e);
      return res
        .status(500)
        .json({ error: "Invalid JSON from AI", raw: cleanedText });
    }

    // === Ensure image_url is valid, fallback to Unsplash placeholders ===
    const safeImageUrls = [
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
      "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0",
      "https://images.unsplash.com/photo-1601050690597-df7e0e0e7b1c",
    ];

    recipes = recipes.map((r, index) => {
      const safeTitle = encodeURIComponent(r.title || "recipe");
      const placeholderImage = safeImageUrls[index % safeImageUrls.length];

      return {
        ...r,
        image_url:
          r.image_url && r.image_url.startsWith("http")
            ? r.image_url
            : placeholderImage,
      };
    });

    // === Return final recipes ===
    return res.status(200).json(recipes);
  } catch (error) {
    console.error("Error generating recipe:", error);
    return res.status(500).json({ error: "Failed to generate recipes" });
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

const likeRecipe = async (req, res) => {
  try {
    const {
      user_id,
      title,
      serving_size,
      prep_time,
      cook_time,
      total_calories,
      ingredients_list,
      instructions,
      notes,
      image_url,
    } = req.body;

    const recipe = await getRecipe(user_id, title);
    if (recipe.length < 1) {
      const data = await addLikedRecipes(
        user_id,
        title,
        serving_size,
        prep_time,
        cook_time,
        total_calories,
        ingredients_list,
        instructions,
        notes,
        image_url
      );
      res.status(200).json({ data: data });
    } else {
      const data = await likeARecipe(user_id, title);
      res.status(200).json({ data: data });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getUserLikedRecipes = async (req, res) => {
  try {
    const { user_id, fridge_id } = req.params;
    const data = await getLikedRecipes(user_id, fridge_id);
    res.status(200).json({ data: data });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const unlikeRecipe = async (req, res) => {
  try {
    const { user_id, name } = req.body;
    const data = await removeFromLikedRecipes(user_id, name);
    res.status(200).json({ data: data });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getUserInProgressRecipes = async (req, res) => {
  try {
    const { user_id, fridge_id } = req.params;
    const data = await getInProgressRecipes(user_id, fridge_id);
    res.status(200).json({ data: data });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getUserCompletedRecipes = async (req, res) => {
  try {
    const { user_id, fridge_id } = req.params;
    const data = await getCompletedRecipes(user_id, fridge_id);
    res.status(200).json({ data: data });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const startRecipe = async (req, res) => {
  try {
    const { recipe } = req.body;
    const data = await addRecipe(recipe);
    res.status(200).json({ data: data });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const findRecipeById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getRecipeById(id);
    res.status(200).json({ data: data });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  talkToAI,
  speechToText,
  generateRecpies,
  likeRecipe,
  getUserLikedRecipes,
  unlikeRecipe,
  getUserInProgressRecipes,
  getUserCompletedRecipes,
  startRecipe,
  findRecipeById,
};
