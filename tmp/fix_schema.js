const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'server', '.env') });
const db = require('../server/db');

async function check() {
    try {
        const res = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'orders'");
        const cols = res.rows.map(r => r.column_name);
        console.log('--- COLUMNS ---');
        console.log(cols.join(', '));
        console.log('----------------');
        
        const required = ['district', 'subtotal_server', 'shipping_server', 'total_server', 'zone_name', 'shiprocket_order_id', 'shipment_id'];
        const missing = required.filter(c => !cols.includes(c));
        
        if (missing.length > 0) {
            console.log('MISSING:', missing.join(', '));
            console.log('Fixing schema...');
            for (const col of missing) {
                let type = 'VARCHAR(255)';
                if (col.includes('_server')) type = 'INTEGER';
                if (col === 'zone_name') type = 'VARCHAR(100)';
                await db.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS ${col} ${type}`);
            }
            console.log('✅ Schema Fix Applied');
        } else {
            console.log('✅ Schema is complete');
        }

        const sz = await db.query("SELECT * FROM shipping_zones");
        console.log('Zones in DB:', sz.rows.length);

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

check();
