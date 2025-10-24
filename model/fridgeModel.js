
const getSupabaseClient = require("../supabase.js");

const fetchFridgeItems = async (id) => {
    try {
        const supabase = await getSupabaseClient();
        const { data, error } = await supabase
            .from('fridge_items')
            .select('*')
            .eq('fridge_id', id)
        
        if (error) {
            console.error("Supabase fetch error:", error);
            throw error;
        }
        
        return data;
    } catch (error) {
        console.error("Error in fetchEvents:", error);
        throw error;
    }
};

module.exports = fetchFridgeItems