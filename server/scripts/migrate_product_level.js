const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/kottravai'
});

async function runMigration() {
    try {
        await client.connect();
        console.log('Connected to database');
        
        await client.query(`
            ALTER TABLE products 
            ADD COLUMN IF NOT EXISTS min_affiliate_level character varying DEFAULT 'Ambassador';
        `);
        
        console.log('Migration successful: Added min_affiliate_level to products');
    } catch (err) {
        console.error('Migration failed:', err.message);
    } finally {
        await client.end();
    }
}

runMigration();
