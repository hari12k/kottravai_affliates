const fs = require('fs');
const path = require('path');
const db = require('../db');

async function setupDatabase() {
    try {
        console.log('⏳ Connecting to database...');

        // Read the SQL schema file
        const schemaPath = path.join(__dirname, '../schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('⏳ Running schema migration...');
        await db.query(schemaSql);

        console.log('✅ Database tables created successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error initializing database:', err);
        process.exit(1);
    }
}

setupDatabase();
