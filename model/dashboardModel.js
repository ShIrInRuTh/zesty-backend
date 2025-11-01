// 1. Use ESM 'import' and import the 'supabase' client directly,
//    just like in your fridgeModel.js
import { supabase } from "../supabaseClient.js"; // <-- Assumed path from your other file

/**
 * Fetches all data needed for the user dashboard in one go.
 * @param {string} userId - The UUID of the logged-in user.
 * @returns {object} An object containing username, fridgeItems, and expiredItems.
 */
export const getDashboardDetails = async (userId) => {
  // 1. Get today's date in 'YYYY-MM-DD' format
  const today = new Date().toISOString().split('T')[0];

  // 2. Get the username
  // 2a. Use the imported 'supabase' client, not getSupabaseClient()
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('username')
    .eq('user_id', userId)
    .single(); 

  if (userError || !user) {
    throw new Error(userError?.message || 'User not found');
  }

  // 3. Get the user's fridge_id
  const { data: fridge, error: fridgeError } = await supabase // <-- 2b. Use 'supabase'
    .from('fridge')
    .select('fridge_id')
    .eq('user_id', userId)
    .single();

  if (fridgeError || !fridge) {
    throw new Error(fridgeError?.message || 'Fridge not found for this user');
  }

  const fridgeId = fridge.fridge_id;

  // 4. Run queries for items in parallel for efficiency
  const [expiringResult, expiredResult] = await Promise.all([
    // Query 4a: Get top 5 items expiring soon (but not yet expired)
    supabase // <-- 2c. This was the main error, now corrected
      .from('fridge_items')
      .select('item_id, item_name, expiry_date') 
      .eq('fridge_id', fridgeId)
      .gte('expiry_date', today) 
      .order('expiry_date', { ascending: true }) 
      .limit(5),
    
    // Query 4b: Get top 5 recently expired items
    supabase // <-- 2d. This was the main error, now corrected
      .from('fridge_items')
      .select('item_id, item_name, expiry_date') 
      .eq('fridge_id', fridgeId)
      .lt('expiry_date', today) 
      .order('expiry_date', { ascending: false }) 
      .limit(5)
  ]);

  // Handle errors from parallel queries
  if (expiringResult.error) throw new Error(expiringResult.error.message);
  if (expiredResult.error) throw new Error(expiredResult.error.message);

  // 5. Return the combined data
  return {
    username: user.username,
    fridgeItems: expiringResult.data.map(item => ({
      id: item.item_id,
      name: item.item_name,
      expiryDate: item.expiry_date
    })),
    expiredItems: expiredResult.data.map(item => ({
      id: item.item_id,
      name: item.item_name,
      expiryDate: item.expiry_date
    }))
  };
};