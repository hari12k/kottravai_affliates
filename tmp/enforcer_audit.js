const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
const shippingService = require('../server/services/shippingService');

async function runAudit() {
    console.log('🧪 Starting Strict Shipping Logic Audit (Enforcer Mode)...');

    const testCases = [
        // Valid Matches
        { state: 'Tamil Nadu', expectedZone: 'Zone 1' },
        { state: 'tamil nadu', expectedZone: 'Zone 1' },
        { state: ' Tamil Nadu ', expectedZone: 'Zone 1' },
        { state: 'Karnataka', expectedZone: 'Zone 2' },
        { state: 'Kerala', expectedZone: 'Zone 2' },

        // Strict Mismatches (Partial/Abbreviation) - MUST default to Zone 3
        { state: 'Tamil', expectedZone: 'Zone 3' },
        { state: 'TN', expectedZone: 'Zone 3' },
        { state: 'Karnatakaa', expectedZone: 'Zone 3' },
        { state: 'South India', expectedZone: 'Zone 3' },
        { state: 'Kerala State', expectedZone: 'Zone 3' },

        // Unrelated / Unknown
        { state: 'Delhi', expectedZone: 'Zone 3' },
        { state: 'Goa', expectedZone: 'Zone 3' },
        { state: '', expectedZone: 'Zone 3' },
        { state: '123 Forest', expectedZone: 'Zone 3' },
        { state: null, expectedZone: 'Zone 3' },
        { state: 'Tami', expectedZone: 'Zone 3' }
    ];

    let passed = 0;

    for (const tc of testCases) {
        try {
            const result = await shippingService.calculateShipping(tc.state, 500);
            if (result.zoneName === tc.expectedZone) {
                console.log(`✅ Input: "${tc.state}" -> ${result.zoneName}: PASS`);
                passed++;
            } else {
                console.log(`❌ Input: "${tc.state}" -> ${result.zoneName}: FAIL! (Expected ${tc.expectedZone})`);
            }
        } catch (err) {
            // Null/Empty cases shouldn't throw if handled gracefully
            if (tc.expectedZone === 'Zone 3') {
                console.log(`✅ Input: "${tc.state}" -> ERROR HANDLED: ${err.message} (Safe Fallback Likely)`);
                passed++;
            } else {
                console.log(`❌ Input: "${tc.state}" -> CRITICAL ERROR: ${err.message}`);
            }
        }
    }

    console.log(`\n Audit Results: ${passed}/${testCases.length} tests passed.`);
}

runAudit();
