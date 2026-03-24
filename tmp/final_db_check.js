require('dotenv').config({ path: './server/.env' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function check() {
    try {
        const res = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);
        console.log('--- TABLES ---');
        res.rows.forEach(row => console.log(row.table_name));
        console.log('--------------');

        const sz = await pool.query("SELECT COUNT(*) FROM shipping_zones");
        console.log('Shipping Zones Count:', sz.rows[0].count);

    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        await pool.end();
    }
}

check();
