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
    try {
        const { data, error } = await supabase
            .from('failed_orders')
            .select('error_message')
            .order('created_at', { ascending: false })
            .limit(1);

        if (data && data.length > 0) {
            console.log('ERROR_MSG_START');
            console.log(data[0].error_message);
            console.log('ERROR_MSG_END');
        }
    } catch (e) { console.error(e); }
}
debug();
