const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('📡 Initializing Supabase with URL:', process.env.SUPABASE_URL ? 'PRESENT' : 'MISSING');
console.log('🔑 Supabase Service Role Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'PRESENT' : 'MISSING');

const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
);

// Validate key type for security warning
if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY.includes('anon')) {
    console.error('❌ CRITICAL ERROR: YOUR SUPABASE_SERVICE_ROLE_KEY IS ACTUALLY AN ANON KEY.');
}

module.exports = supabase;
