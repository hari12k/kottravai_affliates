const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
const shippingService = require('../server/services/shippingService');

async function runAudit() {
    console.log('🧪 Starting Shipping Logic Audit...');

    const testCases = [
        { state: 'Tamil Nadu', cart: 598, expected: { fee: 75, remaining: 1 }, desc: 'CASE 1: Tamil Nadu - Threshold minus 1' },
        { state: 'Tamil Nadu', cart: 599, expected: { fee: 0, remaining: 0 }, desc: 'CASE 2: Tamil Nadu - Threshold met' },
        { state: 'Karnataka', cart: 798, expected: { fee: 99, remaining: 1 }, desc: 'CASE 3: Karnataka - Threshold minus 1' },
        { state: 'Karnataka', cart: 799, expected: { fee: 0, remaining: 0 }, desc: 'CASE 4: Karnataka - Threshold met' },
        { state: 'Delhi', cart: 998, expected: { fee: 125, remaining: 1 }, desc: 'CASE 5: Delhi - Threshold minus 1 (Fallback)' },
        { state: 'Delhi', cart: 999, expected: { fee: 0, remaining: 0 }, desc: 'CASE 6: Delhi - Threshold met (Fallback)' },
        { state: '', cart: 500, expected: { fee: 125, remaining: 499 }, desc: 'CASE 7: Empty state - Should apply fallback' },
        { state: 'tamil nadu', cart: 300, expected: { fee: 75, remaining: 299 }, desc: 'EDGE: Lowercase state' },
        { state: ' Tamil Nadu ', cart: 300, expected: { fee: 75, remaining: 299 }, desc: 'EDGE: Trailing spaces' },
        { state: 'Goaa', cart: 500, expected: { fee: 125, remaining: 499 }, desc: 'EDGE: Unknown state' },
        { state: 'Tamil Nadu', cart: -100, expected: { fee: 75, remaining: 699 }, desc: 'EDGE: Negative cart total' },
        { state: 'Tamil Nadu', cart: 1000000, expected: { fee: 0, remaining: 0 }, desc: 'EDGE: Extremely high cart' }
    ];

    let passed = 0;

    for (const tc of testCases) {
        try {
            const result = await shippingService.calculateShipping(tc.state, tc.cart);
            const feeMatch = result.shippingFee === tc.expected.fee;
            const remainingMatch = Math.abs(result.remainingForFreeShipping - tc.expected.remaining) < 0.01;

            if (feeMatch && remainingMatch) {
                console.log(`✅ ${tc.desc}: PASS`);
                passed++;
            } else {
                console.log(`❌ ${tc.desc}: FAIL! Received fee ${result.shippingFee} (expected ${tc.expected.fee}), remaining ${result.remainingForFreeShipping} (expected ${tc.expected.remaining})`);
            }
        } catch (err) {
            console.log(`❌ ${tc.desc}: ERROR: ${err.message}`);
        }
    }

    console.log(`\n Audit Results: ${passed}/${testCases.length} tests passed.`);
}

runAudit();
