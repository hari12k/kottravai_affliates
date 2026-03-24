const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || 'https://vstlvymtivstlvymtivs.supabase.co', // Fallback from .env read earlier
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debug() {
    console.log('--- DB DEBUG START ---');
    try {
        const { data: failed, error: fError } = await supabase.from('failed_orders').select('*').limit(5);
        if (fError) console.error('Failed Orders Error:', fError);
        else console.log('Recent Failed Orders:', failed);

        const { data: orders, error: oError } = await supabase.from('orders').select('id, payment_id, created_at').order('created_at', { ascending: false }).limit(5);
        if (oError) console.error('Orders Error:', oError);
        else console.log('Most Recent Orders:', orders);

        const { data: pending, error: pError } = await supabase.from('pending_orders').select('*').limit(5);
        if (pError) console.error('Pending Orders Error:', pError);
        else console.log('Recent Pending Orders:', pending);

    } catch (e) {
        console.error('Catch error:', e);
    }
    console.log('--- DB DEBUG END ---');
}

debug();
