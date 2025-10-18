require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) throw new Error('supabaseUrl is required.');
if (!supabaseKey) throw new Error('supabaseKey is required.');

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;