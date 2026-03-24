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

async function check() {
    console.log('Checking Supabase view of tables...');
    
    const { error: e1 } = await supabase.from('products').select('*', { count: 'exact', head: true });
    console.log('Products check:', e1 ? e1.message : 'OK');

    const { error: e2 } = await supabase.from('orders').select('*', { count: 'exact', head: true });
    console.log('Orders check:', e2 ? e2.message : 'OK');
    
    const { error: e3 } = await supabase.from('shipping_zones').select('*', { count: 'exact', head: true });
    console.log('Shipping Zones check:', e3 ? e3.message : 'OK');
}

check();
