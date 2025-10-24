// supabaseClient.js (CommonJS style)
require('dotenv').config();
async function getSupabaseClient() {
  const { createClient } = await import('@supabase/supabase-js')
  const supabaseUrl = process.env.SUPABASE_URL
  console.log(process.env.SUPABASE_URL)
  const supabaseAnonKey = process.env.SUPABASE_KEY
  return createClient(supabaseUrl, supabaseAnonKey)
}

module.exports = getSupabaseClient;
