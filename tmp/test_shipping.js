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

async function testShipping() {
    console.log('Testing shipping_zones fetch...');
    const { data: zones, error } = await supabase
        .from('shipping_zones')
        .select('*')
        .eq('is_active', true);

    if (error) {
        console.error('❌ Supabase Error:', error);
    } else {
        console.log('✅ Found zones:', zones?.length || 0);
        console.log('Zones:', JSON.stringify(zones, null, 2));
    }
}

testShipping();
