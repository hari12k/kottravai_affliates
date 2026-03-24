const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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
    console.log('--- DETAILED FAILED ORDERS ---');
    try {
        const { data, error } = await supabase
            .from('failed_orders')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1);

        if (error) {
            console.error('Error:', error);
        } else if (data && data.length > 0) {
            console.log('ID:', data[0].id);
            console.log('Payment ID:', data[0].payment_id);
            console.log('Error Message:', data[0].error_message);
            console.log('Payload:', JSON.stringify(data[0].payload, null, 2));
        } else {
            console.log('No failed orders found.');
        }

    } catch (e) {
        console.error('Catch error:', e);
    }
}

debug();
