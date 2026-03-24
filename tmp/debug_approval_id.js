const axios = require('axios');

const adminHeaders = { 'X-Admin-Secret': 'admin123', 'Content-Type': 'application/json' };
const BASE_URL = 'http://localhost:5000/api/affiliates';

async function testApprovalBySpecificID() {
    try {
        const id = '87da9fda-b98c-4803-8b27-0ab03bdabe54'; // the ID from user logs
        console.log(`Approving application ${id}...`);

        try {
            const res = await axios.put(BASE_URL + '/admin/applications/' + id, 
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

testApprovalBySpecificID();
