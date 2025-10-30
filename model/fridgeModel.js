const getSupabaseClient = require("../supabase.js");

const fetchFridgeItems = async (id, cat = "") => {
  try {
    const supabase = await getSupabaseClient();

    // Start with fridge_id filter
    let query = supabase.from("fridge_items").select("*").eq("fridge_id", id);

    // Only add category filter if cat is provided
    console.log(cat);
    if (cat != "") {
      console.log("is it here");
      query = query.eq("category", cat); // exact match, just like SQL
    }

    const { data, error } = await query;
    if (error) throw error;

    // console.log(data);
    return data;
  } catch (error) {
    console.error("Error in fetchFridgeItems:", error);
    throw error;
  }
};

const fetchNumberofItems = async (id) => {
  try {
    const supabase = await getSupabaseClient();

    // Start with fridge_id filter
    let query = supabase.from("fridge_items").select("*").eq("fridge_id", id);
    const categories = await supabase
      .from("fridge_items")
      .select("category", { distinct: "category" }) // unique categories
      .eq("fridge_id", id);

    const numOfCategories = {};
    const { data, error } = await query;
    console.log(categories.data);
      const counts = {};
      for (const cat of categories.data) {
        const q = cat.category.toLowerCase();
        counts[q] = data.filter(
          (it) => (it.category).toLowerCase() === q
        ).length;
      }
      console.log(counts);
      return counts;
    if (error) throw error;
  } catch (error) {
    console.error("Error in fetchFridgeItems:", error);
    throw error;
  }
};

module.exports = { fetchFridgeItems, fetchNumberofItems };
