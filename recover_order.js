const { createClient } = require('@supabase/supabase-js');
const Razorpay = require('razorpay');
const fs = require('fs');
const path = require('path');

// Load env from server/.env
const envPath = path.join(__dirname, 'server', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value) env[key.trim()] = value.join('=').trim();
});

// Setup
const supabase = createClient(
    env.SUPABASE_URL || 'https://vstlvymtivstlvymtivs.supabase.co',
    env.SUPABASE_SERVICE_ROLE_KEY
);

const razorpay = new Razorpay({
    key_id: env.RAZORPAY_KEY_ID || 'rzp_live_D6MIGpPCHYQO6C',
    key_secret: env.RAZORPAY_KEY_SECRET
});

// Import local modules for finalizeOrder logic if possible, 
// but since it's in index.js we'll have to replicate or trigger it via HTTP.
// Let's try to trigger it via HTTP since the server might be running locally.
const axios = require('axios');

async function recover(paymentId) {
    console.log(`🚀 Starting recovery for payment: ${paymentId}`);
    try {
        const url = `http://localhost:5000/api/recover-order/${paymentId}`;
        const response = await axios.get(url);
        console.log('✅ Recovery Response:', response.data);
    } catch (error) {
        console.error('❌ Recovery Failed:', error.response ? error.response.data : error.message);
        
        // If server is not running, we could manually call the functions, 
        // but it's better to ensure the server is up and hit the endpoint.
    }
}

const targetPaymentId = 'pay_SSD5sHUU3pQxuo';
recover(targetPaymentId);
