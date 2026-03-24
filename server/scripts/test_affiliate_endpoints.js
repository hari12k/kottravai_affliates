const assert = require('assert');

const adminHeaders = { 'X-Admin-Secret': 'admin123', 'Content-Type': 'application/json' };
const BASE_URL = 'http://localhost:5000/api/affiliates';

async function request(method, path, headers, body) {
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(BASE_URL + path, opts);
    let json = {};
    if (res.headers.get('content-type')?.includes('application/json')) {
        json = await res.json();
    }
    return { status: res.status, json };
}

async function runTests() {
    console.log('⏳ Running sanity tests for Affiliates API...\n');
    let passed = 0;
    try {
        // 1. Test Products Endpoint 
        let res = await request('GET', '/products', { 'Content-Type': 'application/json' });
        assert(res.status === 200, 'GET /products should return 200');
        console.log('✅ GET /products OK');
        passed++;

        // 2. Test Apply
        const uniqueEmail = 'test' + Date.now() + '@example.com';
        res = await request('POST', '/apply', { 'Content-Type': 'application/json' }, {
            name: "Automated Tester", email: uniqueEmail, phone: "5551234567"
        });
        assert(res.status === 201, 'POST /apply should return 201 Created');
        console.log('✅ POST /apply OK');
        passed++;

        // 3. Test Admin Get Applications
        res = await request('GET', '/admin/applications', adminHeaders);
        assert(res.status === 200, 'GET /admin/applications should return 200');
        console.log('✅ GET /admin/applications OK');
        passed++;

        // 4. Test Fetch Profile (without an affiliate record)
        const authHeaders = { 'X-Auditor-Secret': 'audit123', 'Content-Type': 'application/json' };
        res = await request('GET', '/me', authHeaders);
        // We expect a 404 because the auditor doesn't actually have an affiliate record
        assert(res.status === 404, 'GET /me without a profile should return 404 cleanly');
        console.log('✅ GET /me (Not Found Handle) OK');
        passed++;

        console.log(`\n🎉 Tests completed successfully! ${passed}/${passed} passed.`);
        process.exit(0);

    } catch (err) {
        console.error('❌ Test failed:', err.message);
        process.exit(1);
    }
}

runTests();
