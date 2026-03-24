require('dotenv').config({ path: './.env' });
const { Pool } = require('pg');

const verifySupabase = async () => {
    console.log('--- Supabase Connection Verification ---');

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error('❌ Missing DATABASE_URL');
        process.exit(1);
    }

    // Mask password for log
    const maskedUrl = dbUrl.replace(/:([^@]+)@/, ':****@');
    console.log(`URL: ${maskedUrl}`);

    if (!dbUrl.includes('supabase.com')) {
        console.error('❌ URL does not point to Supabase');
        process.exit(1);
    }

    const pool = new Pool({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('Connecting...');
        const client = await pool.connect();
        console.log('✅ Connected to Supabase!');

        const res = await client.query('SELECT NOW() as now');
        console.log(`✅ System Time: ${res.rows[0].now}`);

        console.log('\n--- Checking Tables ---');
        const tablesRes = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);
        const tables = tablesRes.rows.map(r => r.table_name);
        console.log('Found Tables:', tables.join(', '));

        if (tables.includes('products')) {
            const pCount = await client.query('SELECT COUNT(*) FROM products');
            console.log(`Products: ${pCount.rows[0].count}`);
        } else {
            console.warn('⚠️ Products table missing!');
        }

        client.release();
        await pool.end();
        console.log('✅ Verification Complete');

    } catch (err) {
        console.error('❌ Connection Failed:', err.message);
        console.error('Stack:', err.stack);
        if (err.code) console.error('Code:', err.code);
        process.exit(1);
    }
};

verifySupabase();
