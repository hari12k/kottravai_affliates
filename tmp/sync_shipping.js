const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './server/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncShippingZones() {
    console.log('🚀 Synchronizing Shipping Zones (Final Rules)...');

    // 1. Clear existing
    const { error: deleteError } = await supabase
        .from('shipping_zones')
        .delete()
        .neq('id', -1);

    if (deleteError) {
        console.error('❌ Error clearing shipping zones:', deleteError.message);
        return;
    }

    // 2. Insert new zones with empty array for fallback to satisfy NOT NULL constraint
    const zones = [
        {
            zone_name: 'Zone 1',
            states: ['Tamil Nadu'],
            shipping_charge: 75,
            free_shipping_threshold: 599,
            is_active: true,
            is_fallback: false
        },
        {
            zone_name: 'Zone 2',
            states: ['Karnataka', 'Kerala', 'Andhra Pradesh', 'Telangana'],
            shipping_charge: 99,
            free_shipping_threshold: 799,
            is_active: true,
            is_fallback: false
        },
        {
            zone_name: 'Zone 3',
            states: [], // Empty array for not-null states column
            shipping_charge: 125,
            free_shipping_threshold: 999,
            is_active: true,
            is_fallback: true
        }
    ];

    const { error: insertError } = await supabase
        .from('shipping_zones')
        .insert(zones);

    if (insertError) {
        console.error('❌ Error inserting shipping zones:', insertError.message);
    } else {
        console.log('✅ Final shipping zones applied (Tamil Nadu, South ROI, Rest of India).');
    }
}

syncShippingZones();
