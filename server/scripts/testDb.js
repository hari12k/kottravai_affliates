const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres.aqslafzgemwbyuldkvwe',
    host: 'aws-1-ap-south-1.pooler.supabase.com',
    database: 'postgres',
    password: 'Kottravai@123',
    port: 5432,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.connect()
    .then(client => {
        console.log('✅ Connected successfully!');
        client.release();
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Connection Failed:');
        console.error('Code:', err.code);
        console.error('Message:', err.message);
        process.exit(1);
    });
