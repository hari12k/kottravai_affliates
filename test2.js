require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.VITE_DATABASE_URL
});
pool.query("SELECT indexname FROM pg_indexes WHERE tablename = 'orders';")
    .then(r => { console.log('RES_ROWS:', JSON.stringify(r.rows)); process.exit(0); })
    .catch(e => { console.log('ERROR:', e.message); process.exit(0); });
