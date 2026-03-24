const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse server/.env
const envPath = path.join(__dirname, '..', 'server', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value) env[key.trim()] = value.join('=').trim();
});

const supabase = createClient(
    env.SUPABASE_URL || 'https://vstlvymtivstlvymtivs.supabase.co',
    env.SUPABASE_SERVICE_ROLE_KEY
);

async function debug() {
    console.log('--- DB DEBUG START ---');
    try {
        const { data: failed, error: fError } = await supabase.from('failed_orders').select('*').order('created_at', { ascending: false }).limit(5);
        if (fError) console.error('Failed Orders Error:', fError);
        else console.log('Recent Failed Orders:', JSON.stringify(failed, null, 2));

        const { data: orders, error: oError } = await supabase.from('orders').select('id, payment_id, created_at').order('created_at', { ascending: false }).limit(5);
        if (oError) console.error('Orders Error:', oError);
        else console.log('Most Recent Orders:', JSON.stringify(orders, null, 2));

    } catch (e) {
        console.error('Catch error:', e);
    }
    console.log('--- DB DEBUG END ---');
}

debug();
