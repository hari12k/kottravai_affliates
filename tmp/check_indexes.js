require('dotenv').config();
const db = require('../server/db');

async function checkIndexes() {
    try {
        const res = await db.query("SELECT indexname FROM pg_indexes WHERE tablename = 'orders';");
        console.log('---INDEX_RESULTS---');
        console.log(JSON.stringify(res.rows));
        console.log('---END_RESULTS---');
        process.exit(0);
    } catch (err) {
        console.error('Error checking indexes:', err);
        process.exit(1);
    }
}

checkIndexes();
