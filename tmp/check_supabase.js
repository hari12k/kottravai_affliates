const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './server/.env' });

const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkSupabase() {
    try {
        console.log('Testing Supabase Auth Admin Access...');
        const { data, error } = await supabase.auth.admin.listUsers();
        if (error) {
            console.error('Supabase Error:', error.message);
            console.error('Error Details:', JSON.stringify(error, null, 2));
        } else {
            console.log('Successfully connected to Supabase Auth!');
            console.log('Total users found:', data.users.length);
        }
    } catch (err) {
        console.error('Script Runtime Error:', err.message);
    }
}

checkSupabase();
