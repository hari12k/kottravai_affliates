const db = require('./server/db');

async function run() {
    try {
        console.log('Validating table existence/creation...');
        await db.query(`
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
        
        console.log('Inserting mock data...');
        await db.query(`
            INSERT INTO alliance_applications (name, address, phone, insta_id, facebook_id)
            VALUES 
            ('Santhosh Kumar', '123 Main Street, Chennai, TN, 600001', '+91 9876543210', '@santhosh_k', 'https://facebook.com/santhoshk'),
            ('Kottravai Partner', '45 Cross Road, Bangalore, KA', '+91 9988776655', '@kottravai_partner', null)
        `);
        
        console.log('✅ Successfully inserted mock records!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Failed to insert:', err.message);
        process.exit(1);
    }
}
run();
