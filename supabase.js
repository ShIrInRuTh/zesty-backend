// supabase.js (Fixed CommonJS version)
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

module.exports = getSupabaseClient;
