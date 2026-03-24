const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
);

async function checkFailedOrders() {
    console.log('Checking failed_orders table...');
    const { data, error } = await supabase
        .from('failed_orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching failed orders:', error);
        return;
    }

    console.log('Recent Failed Orders:', JSON.stringify(data, null, 2));
}

checkFailedOrders();
