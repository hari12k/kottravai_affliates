require('dotenv').config({ path: './server/.env' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function getCols() {
    try {
        const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'orders'");
        console.log('COLS_START');
        console.log(res.rows.map(r => r.column_name).join(','));
        console.log('COLS_END');
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

getCols();
