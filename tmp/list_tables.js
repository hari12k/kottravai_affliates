const db = require('../server/db');

async function checkTables() {
    try {
        const res = await db.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);
        console.log('--- TABLES IN PUBLIC SCHEMA ---');
        res.rows.forEach(row => console.log('- ' + row.table_name));
        console.log('-------------------------------');
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        process.exit();
    }
}

checkTables();
