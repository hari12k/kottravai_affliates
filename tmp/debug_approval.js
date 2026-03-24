const axios = require('axios');

const adminHeaders = { 'X-Admin-Secret': 'admin123', 'Content-Type': 'application/json' };
const BASE_URL = 'http://localhost:5000/api/affiliates';

async function testApproval() {
    try {
        console.log('Fetching applications...');
        const resApps = await axios.get(BASE_URL + '/admin/applications', { headers: adminHeaders });
        const apps = resApps.data;
        
        if (!apps.success || apps.applications.length === 0) {
            console.log('No applications found to test with.');
            return;
        }

        // Filter for a pending one if possible
        const targetApp = apps.applications.find(a => a.status === 'pending' || a.status === 'Pending') || apps.applications[0];
        console.log(`Approving application ${targetApp.id} (${targetApp.email})...`);

        try {
            const res = await axios.put(BASE_URL + '/admin/applications/' + targetApp.id, 
                { status: 'Approved' },
                { headers: adminHeaders }
            );

            console.log('Status:', res.status);
            console.log('Result:', JSON.stringify(res.data, null, 2));
        } catch (apiError) {
            if (apiError.response) {
                console.log('API Error Response Status:', apiError.response.status);
                console.log('API Error Data:', JSON.stringify(apiError.response.data, null, 2));
            } else {
                console.log('API Error message:', apiError.message);
            }
        }

    } catch (err) {
        console.error('Script error:', err.message);
    }
}

testApproval();
