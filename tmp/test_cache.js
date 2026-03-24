const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const shippingService = require('../server/services/shippingService');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testCache() {
    console.log('📦 Starting Cache Validation...');

    // 1. Initial Call (Populate Cache)
    const res1 = await shippingService.calculateShipping('Tamil Nadu', 100);
    console.log(`Initial Fee: ₹${res1.shippingFee}`);

    // 2. Temporarily Update Database Value
    console.log('🔄 Updating DB value (Zone 1 fee -> 999)...');
    await supabase.from('shipping_zones').update({ shipping_charge: 999 }).eq('zone_name', 'Zone 1');

    // 3. Confirm Cache STILL has the old value
    const res2 = await shippingService.calculateShipping('Tamil Nadu', 100);
    console.log(`Post-update Fee (should be ₹${res1.shippingFee}): ₹${res2.shippingFee}`);

    if (res1.shippingFee === res2.shippingFee) {
        console.log('✅ PASS: Cache is working (OLD value preserved).');
    } else {
        console.log('❌ FAIL: Cache missed or skipped!');
    }

    // 4. Force Invalidation
    console.log('🧹 Invalidating Cache...');
    await shippingService.refreshShippingCache();

    // 5. Confirm NEW value reflects
    const res3 = await shippingService.calculateShipping('Tamil Nadu', 100);
    console.log(`Post-invalidation Fee (should be ₹999): ₹${res3.shippingFee}`);

    if (res3.shippingFee === 999) {
        console.log('✅ PASS: Cache invalidated correctly.');
    } else {
        console.log('❌ FAIL: Cache invalidation failed!');
    }

    // 6. Restore Value
    console.log('♻️ Restoring Zone 1 fee -> 75...');
    await supabase.from('shipping_zones').update({ shipping_charge: 75 }).eq('zone_name', 'Zone 1');
    await shippingService.refreshShippingCache();

    console.log('Cache Validation Complete.');
}

testCache();
