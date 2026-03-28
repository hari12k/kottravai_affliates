require('dotenv').config({ path: './server/.env' });
const db = require('../server/db');

async function checkData() {
    try {
        const affiliates = await db.query('SELECT id FROM affiliates LIMIT 5');
        const orders = await db.query('SELECT id FROM orders LIMIT 5');
        const links = await db.query('SELECT id FROM affiliate_links LIMIT 5');

        console.log('Affiliates count:', affiliates.rows.length);
        console.log('Orders count:', orders.rows.length);
        console.log('Links count:', links.rows.length);

        console.log('--- Affiliates ---');
        affiliates.rows.forEach(r => console.log(r.id));
        console.log('--- Orders ---');
        orders.rows.forEach(r => console.log(r.id));
        console.log('--- Links ---');
        links.rows.forEach(r => console.log(r.id));
    } catch (err) {
        console.error('Error checking data:', err);
    } finally {
        process.exit();
    }
}

checkData();
