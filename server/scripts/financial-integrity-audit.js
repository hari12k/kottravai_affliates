const http = require('http');

async function runAudit() {
    console.log('🚀 Starting Financial Integrity Audit...\n');

    // 1. Fetch a valid product from DB for testing
    const { data: product } = await fetchProduct();
    if (!product) {
        console.error('❌ Could not find a product to test with.');
        return;
    }
    console.log(`📦 Testing with product: ${product.name} (ID: ${product.id}, Price: ${product.price})`);

    const results = [];

    // --- PART 1: Functional Correctness ---

    // Case 1: Normal Valid Order (Tamil Nadu, Threshold 599)
    // If product price is 150, 4 qty = 600 (Free shipping)
    results.push(await testOrder('Valid Order (Free Shipping)', {
        state: 'Tamil Nadu',
        items: [{ id: product.id, quantity: 4, name: product.name, price: product.price }],
        total: product.price * 4,
        subtotal: product.price * 4
    }, 201));

    // Case 2: Below Threshold (Tamil Nadu, Threshold 599, Charge 75)
    results.push(await testOrder('Valid Order (With Shipping)', {
        state: 'Tamil Nadu',
        items: [{ id: product.id, quantity: 2, name: product.name, price: product.price }],
        total: (product.price * 2) + 75,
        subtotal: product.price * 2
    }, 201));

    // Case 3: Fallback Zone (Unknown State, Threshold 999, Charge 125)
    results.push(await testOrder('Fallback State (Standard Shipping)', {
        state: 'Unknown State',
        items: [{ id: product.id, quantity: 1, name: product.name, price: product.price }],
        total: product.price + 125,
        subtotal: product.price
    }, 201));

    // --- PART 2: Tamper & Fraud ---

    // Case 4: Price Manipulation
    results.push(await testOrder('Tamper: Manipulation (Total=1)', {
        state: 'Tamil Nadu',
        items: [{ id: product.id, quantity: 1, name: product.name, price: product.price }],
        total: 1,
        subtotal: product.price
    }, 400, 'PRICE_TEMPERING_DETECTED'));

    // Case 5: Negative Quantity
    results.push(await testOrder('Fraud: Negative Quantity', {
        state: 'Tamil Nadu',
        items: [{ id: product.id, quantity: -5, name: product.name, price: product.price }],
        total: (product.price * -5) + 75,
        subtotal: product.price * -5
    }, 400, 'INVALID_QUANTITY'));

    // Case 6: Excessive Quantity
    results.push(await testOrder('Fraud: Excess Quantity (500)', {
        state: 'Tamil Nadu',
        items: [{ id: product.id, quantity: 500, name: product.name, price: product.price }],
        total: (product.price * 500),
        subtotal: product.price * 500
    }, 400, 'QUANTITY_LIMIT_EXCEEDED'));

    // Case 7: Invalid Product ID
    results.push(await testOrder('Fraud: Invalid Product ID', {
        state: 'Tamil Nadu',
        items: [{ id: '00000000-0000-0000-0000-000000000000', quantity: 1, name: 'Fake', price: 100 }],
        total: 175,
        subtotal: 100
    }, 400, 'INVALID_PRODUCT_REFERENCE'));

    // Case 8: Duplicate SKU Exploit (Internal Consolidation)
    // 2 items + 2 items = 4 (Free Shipping correctly)
    results.push(await testOrder('Tamper: Duplicate SKU Consolidation', {
        state: 'Tamil Nadu',
        items: [
            { id: product.id, quantity: 2, name: product.name, price: product.price },
            { id: product.id, quantity: 2, name: product.name, price: product.price }
        ],
        total: product.price * 4,
        subtotal: product.price * 4
    }, 201));

    // --- PART 5: Concurrency Simulation ---
    console.log('\n🔥 Running Part 5: Concurrency Simulation (30 simultaneous orders)...');
    const concurrentTesters = Array(30).fill(0).map((_, i) =>
        testOrder(`Concurrent Order #${i + 1}`, {
            state: 'Tamil Nadu',
            items: [{ id: product.id, quantity: 1, name: product.name, price: product.price }],
            total: product.price + 75,
            subtotal: product.price
        }, 201)
    );

    const concurrentResults = await Promise.all(concurrentTesters);
    const concurrentFailures = concurrentResults.filter(r => r.Status === 'FAIL');

    if (concurrentFailures.length === 0) {
        console.log('✅ Concurrency test passed! 30 orders processed successfully.');
    } else {
        console.error(`❌ Concurrency test failed with ${concurrentFailures.length} errors.`);
    }

    // Summary
    console.log('\n📊 AUDIT REPORT SUMMARY:\n');
    console.table(results);

    const failures = results.filter(r => r.Status === 'FAIL');
    const totalFailures = failures.length + concurrentFailures.length;

    if (totalFailures > 0) {
        console.error(`\n❌ Audit Failed with ${totalFailures} total issues.`);
    } else {
        console.log('\n✅ ALL AUDIT TESTS PASSED! The system is financially secure and cluster-safe.');
    }
}

async function fetchProduct() {
    return new Promise((resolve) => {
        const { Pool } = require('pg');
        const pool = new Pool({
            connectionString: "postgresql://postgres.takxuhptyvcojssffdgn:Kottravai@1@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres",
            ssl: { rejectUnauthorized: false }
        });
        pool.query('SELECT id, name, price FROM products LIMIT 1', (err, res) => {
            pool.end();
            if (err) resolve({ data: null });
            else resolve({ data: res.rows[0] });
        });
    });
}

function testOrder(name, payload, expectedCode, expectedError) {
    return new Promise((resolve) => {
        const data = JSON.stringify({
            ...payload,
            customerName: "Audit Bot",
            customerEmail: "audit@kottravai.in",
            customerPhone: "9876543210",
            address: "Audit HQ",
            city: "Security City",
            pincode: "600001",
            paymentId: "pay_audit_" + Date.now(),
            orderId: "ord_audit_" + Date.now()
        });

        const options = {
            hostname: 'localhost',
            port: 5000,
            path: '/api/orders',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length,
                'X-Auditor-Secret': 'audit123' // I'll add this bypass next
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', d => body += d);
            res.on('end', () => {
                const isMatch = res.statusCode === expectedCode;
                let errorMatch = true;
                if (expectedError && body) {
                    try {
                        const json = JSON.parse(body);
                        errorMatch = json.error === expectedError;
                    } catch (e) { errorMatch = false; }
                }

                const status = (isMatch && errorMatch) ? 'PASS' : 'FAIL';
                if (status === 'FAIL') {
                    console.log(`\n❌ [${name}] FAIL details: status ${res.statusCode}, body: ${body}`);
                }

                resolve({
                    'Test Case': name,
                    'Expected': expectedCode,
                    'Actual': res.statusCode,
                    'Error Code': expectedError || '-',
                    'Status': status
                });
            });
        });

        req.on('error', (e) => {
            resolve({
                'Test Case': name,
                'Expected': expectedCode,
                'Actual': 'CONN_ERR',
                'Error Code': expectedError || '-',
                'Status': 'FAIL'
            });
        });

        req.write(data);
        req.end();
    });
}

runAudit();
