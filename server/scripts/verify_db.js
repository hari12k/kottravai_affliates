require('dotenv').config({ path: './.env' });
const { Pool } = require('pg');

const verifyDb = async () => {
    console.log('--- Database Connection Verification ---');

    // 1. Check Env Vars
    if (!process.env.DATABASE_URL) {
        console.error('❌ Missing DATABASE_URL in .env');
        process.exit(1);
    }
    console.log(`Target URL: ${process.env.DATABASE_URL.replace(/:[^:]+@/, ':****@')}`); // Hide password

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        // 2. Test Connection
        const client = await pool.connect();
        console.log('✅ Connection to PostgreSQL successful!');

        // 3. Test Query
        const res = await client.query('SELECT NOW() as now');
        console.log(`✅ Time Query Success: ${res.rows[0].now}`);

        // 4. Test Schema/Tables
        console.log('\n--- Checking Tables ---');
        const tablesRes = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);

        const tables = tablesRes.rows.map(r => r.table_name);
        console.log('Found Tables:', tables.join(', '));

        const expectedTables = ['products', 'orders', 'reviews'];
        const missing = expectedTables.filter(t => !tables.includes(t));

        if (missing.length > 0) {
            console.warn(`⚠️ Warning: Missing expected tables: ${missing.join(', ')}`);
        } else {
            console.log('✅ All core tables (products, orders, reviews) are present.');
        }

        // 5. Count Records
        if (tables.includes('products')) {
            const count = await client.query('SELECT COUNT(*) FROM products');
            console.log(`   Products Count: ${count.rows[0].count}`);
        }
        if (tables.includes('orders')) {
            const count = await client.query('SELECT COUNT(*) FROM orders');
            console.log(`   Orders Count: ${count.rows[0].count}`);
        }

        client.release();
        await pool.end();
        console.log('\n✅ Database verification completed successfully.');

    } catch (err) {
        console.error('❌ Database Connection Failed:', err.message);
        if (err.code === 'ECONNREFUSED') {
            console.error('   Hint: Is PostgreSQL running? Check port 5432.');
        }
        process.exit(1);
    }
};

verifyDb();
