const getSupabaseClient = require("../supabase.js");

const getExpiringItems = async (id) => {
  try {
    const supabase = await getSupabaseClient();
    // Get today's date and the date 14 days later
    const today = new Date().toISOString();
    const twoWeeksLater = new Date(
      Date.now() + 14 * 24 * 60 * 60 * 1000
    ).toISOString();

    const { data, error } = await supabase
      .from("fridge_items")
      .select("*")
      .eq("fridge_id", id)
      .gt("expiry_date", today)
      .lt("expiry_date", twoWeeksLater);

    if (error) {
      console.error(error);
    } else {
      console.log(data);
    }

    return data;
  } catch (error) {
    console.error("Error in fetchFridgeItems:", error);
    throw error;
  }
};

const addLikedRecipes = async (
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
) => {
  try {
    const supabase = await getSupabaseClient();

    const { data, error } = await supabase.from("recipes").insert([
      {
        user_id,
        liked: true, // default liked
        status: "not started", // default status
        title,
        serving_size,
        prep_time,
        cook_time,
        total_calories,
        ingredients_list, // JSON array of objects [{name, portion}, ...]
        instructions, // JSON array of strings
        notes,
        image_url,
      },
    ]);

    if (error) {
      console.error("Supabase insert error:", error);
    } else {
      console.log("Inserted recipe:", data);
    }

    return data;
  } catch (error) {
    console.error("Error in addLikedRecipes:", error);
    throw error;
  }
};

const likeARecipe = async (user_id, name) => {
  try {
    const supabase = await getSupabaseClient();

    const { data, error } = await supabase
      .from("recipes")
      .update({ liked: true })
      .eq("user_id", user_id)
      .eq("title", name);

    if (error) {
      console.error("Error removing liked recipe:", error);
    } else {
      console.log("Recipe removed from liked:", data);
    }

    return data;
  } catch (error) {
    console.error("Error in removeFromLikedRecipes:", error);
    throw error;
  }
};

// Enhanced getLikedRecipes, add fridge_id argument!
const getLikedRecipes = async (user_id, fridge_id) => {
  try {
    const supabase = await getSupabaseClient();

    // Fetch liked recipes as before
    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .eq("user_id", user_id)
      .eq("liked", true);

    if (error) {
      console.error("Error fetching liked recipes:", error);
      return [];
    }

    // Augment each recipe with inFridgeCount and expiringSoonCount
    const enhanced = await Promise.all(
      data.map(async (recipe) => {
        let matchStats = { inFridgeCount: 0, expiringSoonCount: 0 };
        // Only check if there are ingredients_list and fridge_id provided
        if (recipe.ingredients_list && fridge_id) {
          try {
            matchStats = await checkIngredientsInFridge(
              recipe.ingredients_list,
              fridge_id
            );
          } catch (err) {
            console.error(
              "Error checking ingredients for recipe",
              recipe.title,
              err
            );
          }
        }
        return {
          ...recipe,
          ...matchStats,
        };
      })
    );

    return enhanced;
  } catch (error) {
    console.error("Error in getLikedRecipes:", error);
    return [];
  }
};

const removeFromLikedRecipes = async (user_id, name) => {
  try {
    const supabase = await getSupabaseClient();

    const { data, error } = await supabase
      .from("recipes")
      .update({ liked: false })
      .eq("user_id", user_id)
      .eq("title", name);

    if (error) {
      console.error("Error removing liked recipe:", error);
    } else {
      console.log("Recipe removed from liked:", data);
    }

    return data;
  } catch (error) {
    console.error("Error in removeFromLikedRecipes:", error);
    throw error;
  }
};

const getRecipe = async (user_id, name) => {
  try {
    const supabase = await getSupabaseClient();

    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .eq("user_id", user_id)
      .eq("title", name);

    if (error) {
      console.error("Error getting  recipe:", error);
    } else {
      console.log("Recipe retrieved:", data);
    }

    return data;
  } catch (error) {
    console.error("Error in getRecipe:", error);
    throw error;
  }
};

const checkIngredientsInFridge = async (ingredients, fridge_id) => {
  try {
    const supabase = await getSupabaseClient();

    const { data: fridgeItems, error } = await supabase
      .from("fridge_items")
      .select("item_name, expiry_date")
      .eq("fridge_id", fridge_id);

    if (error) throw error;

    function normalize(name) {
      if (!name) return "";
      return name
        .replace(/\(.*\)/, "")
        .replace(/[^a-zA-Z\s]/g, "")
        .toLowerCase()
        .split(",")[0]
        .trim();
    }

    const fridgeNames = fridgeItems.map((item) => normalize(item.item_name));
    const expiringSoonItems = fridgeItems.filter((item) => {
      if (!item.expiry_date) return false;

      const now = new Date();
      const expiry = new Date(item.expiry_date);

      // Calculate days until expiry
      const daysLeft = (expiry - now) / (1000 * 3600 * 24);

      // Keep items that expire in 0–14 days (not expired yet)
      return daysLeft >= 0 && daysLeft <= 14;
    });

    // Set for quick lookup of expiringSoon item names (normalized)
    const expiringSoonSet = new Set(
      expiringSoonItems.map((item) => normalize(item.item_name))
    );
    // Map normalized to actual fridge name for display
    const expiringSoonNameMap = {};
    expiringSoonItems.forEach((item) => {
      expiringSoonNameMap[normalize(item.item_name)] = item.item_name;
    });

    let inFridgeCount = 0;
    let expiringSoonCount = 0;
    let expiringSoonMatchedNames = [];

    ingredients.forEach((ingredient) => {
      const n = normalize(ingredient.name);
      if (fridgeNames.includes(n)) {
        inFridgeCount++;
        if (expiringSoonSet.has(n)) {
          expiringSoonCount++;
          expiringSoonMatchedNames.push(
            expiringSoonNameMap[n] || ingredient.name
          );
        }
      }
    });

    return {
      inFridgeCount,
      expiringSoonCount,
      expiringSoonMatchedNames, // <-- new!
    };
  } catch (error) {
    console.error("Error in checkIngredientsInFridge:", error);
    throw error;
  }
};

const getInProgressRecipes = async (user_id, fridge_id) => {
  try {
    const supabase = await getSupabaseClient();

    // Fetch liked recipes as before
    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .eq("user_id", user_id)
      .eq("status", "in progress");

    if (error) {
      console.error("Error fetching in progress recipes:", error);
      return [];
    }

    // Augment each recipe with inFridgeCount and expiringSoonCount
    const enhanced = await Promise.all(
      data.map(async (recipe) => {
        let matchStats = { inFridgeCount: 0, expiringSoonCount: 0 };
        // Only check if there are ingredients_list and fridge_id provided
        if (recipe.ingredients_list && fridge_id) {
          try {
            matchStats = await checkIngredientsInFridge(
              recipe.ingredients_list,
              fridge_id
            );
          } catch (err) {
            console.error(
              "Error checking ingredients for recipe",
              recipe.title,
              err
            );
          }
        }
        return {
          ...recipe,
          ...matchStats,
        };
      })
    );

    return enhanced;
  } catch (error) {
    console.error("Error in getInProgressRecipes:", error);
    return [];
  }
};

const getCompletedRecipes = async (user_id, fridge_id) => {
  try {
    const supabase = await getSupabaseClient();

    // Fetch liked recipes as before
    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .eq("user_id", user_id)
      .eq("status", "completed");

    if (error) {
      console.error("Error fetching in completed recipes:", error);
      return [];
    }

    // Augment each recipe with inFridgeCount and expiringSoonCount
    const enhanced = await Promise.all(
      data.map(async (recipe) => {
        let matchStats = { inFridgeCount: 0, expiringSoonCount: 0 };
        // Only check if there are ingredients_list and fridge_id provided
        if (recipe.ingredients_list && fridge_id) {
          try {
            matchStats = await checkIngredientsInFridge(
              recipe.ingredients_list,
              fridge_id
            );
          } catch (err) {
            console.error(
              "Error checking ingredients for recipe",
              recipe.title,
              err
            );
          }
        }
        return {
          ...recipe,
          ...matchStats,
        };
      })
    );

    return enhanced;
  } catch (error) {
    console.error("Error in getCompletedRecipes:", error);
    return [];
  }
};

const addRecipe = async (recipe) => {
  try {
    console.log(recipe.title, recipe.user_id);
    const supabase = await getSupabaseClient();

    // 1️⃣ Check if recipe already exists
    const { data: recipeFound, error: fetchError } = await supabase
      .from("recipes")
      .select("*")
      .eq("title", recipe.title)
      .eq("user_id", recipe.user_id);

    if (fetchError) {
      console.error("Error fetching recipes:", fetchError);
      return [];
    }

    if (recipeFound.length >= 1) {
      console.log("Recipe already exists:", recipeFound);
      return recipeFound;
    }

    // 2️⃣ Insert new recipe
    const { data: insertedData, error: insertError } = await supabase
      .from("recipes")
      .insert([
        {
          user_id: recipe.user_id,
          liked: false,
          status: "in progress",
          title: recipe.title,
          serving_size: recipe.serving_size,
          prep_time: recipe.prep_time,
          cook_time: recipe.cook_time,
          total_calories: recipe.total_calories,
          ingredients_list: recipe.ingredients_list,
          instructions: recipe.instructions,
          notes: recipe.notes,
          image_url: recipe.image_url,
        },
      ])
      .select("*"); // return the inserted row(s)

    if (insertError) {
      console.error("Supabase insert error:", insertError);
      return [];
    }

    console.log("Inserted recipe:", insertedData);
    return insertedData;
  } catch (error) {
    console.error("Error in addRecipe:", error);
    return [];
  }
};

const getRecipeById = async (id) => {
  try {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .eq("id", id);
    return data;
  } catch (error) {
    console.error("Error in addRecipe:", error);
    return [];
  }
};

module.exports = {
  getExpiringItems,
  addLikedRecipes,
  getLikedRecipes,
  removeFromLikedRecipes,
  getRecipe,
  likeARecipe,
  checkIngredientsInFridge,
  getInProgressRecipes,
  getCompletedRecipes,
  addRecipe,
  getRecipeById,
};
