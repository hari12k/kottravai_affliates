require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.VITE_DATABASE_URL
});

async function run() {
    try {
        console.log('Creating table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS alliance_applications (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(255) NOT NULL,
                address TEXT NOT NULL,
                phone VARCHAR(20) NOT NULL,
                insta_id VARCHAR(255),
                facebook_id VARCHAR(255),
                twitter_id VARCHAR(255),
                youtube_id VARCHAR(255),
                status VARCHAR(50) DEFAULT 'Pending',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Success');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
