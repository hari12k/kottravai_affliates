
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const insertManualSale = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Get an Approved Affiliate
        console.log("🔍 Looking for approved affiliates...");
        const affRes = await client.query("SELECT id, name, referral_code FROM affiliates WHERE status = 'Approved' LIMIT 1");
        
        if (affRes.rows.length === 0) {
            console.log("❌ No approved affiliates found. Please approve an application first.");
            return;
        }
        const affiliate = affRes.rows[0];
        console.log(`👤 Using Affiliate: ${affiliate.name} (${affiliate.referral_code})`);

        // 2. Mock Order Data
        const orderId = `TEST-MANUAL-${Date.now()}`;
        const saleAmount = 1450.00;
        const commissionRate = 10.00;
        const commissionAmount = 145.00;

        // 3. Insert Mock Order
        console.log("📦 Creating mock order...");
        const orderRes = await client.query(`
            INSERT INTO orders (
                customer_name, customer_email, customer_phone, address, city, state, pincode, 
                total, status, order_id, payment_id, subtotal_server, total_server, items
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING id
        `, [
            'Test Customer', 'test@example.com', '9999999999', '123 Test Lane', 'Chennai', 'Tamil Nadu', '600001',
            saleAmount, 'Processing', orderId, `pay_${Date.now()}`, saleAmount, saleAmount, JSON.stringify([{name: "Test item", quantity: 1, price: saleAmount}])
        ]);
        const dbOrderId = orderRes.rows[0].id;

        // 4. Update order with affiliate info (simulating finalizeOrder logic)
        await client.query('UPDATE orders SET affiliate_id = $1, referral_code = $2 WHERE id = $3', [affiliate.id, affiliate.referral_code, dbOrderId]);

        // 5. Insert Affiliate Sale
        console.log("💰 Inserting affiliate sale record...");
        await client.query(`
            INSERT INTO affiliate_sales (
                affiliate_id, order_id, sale_amount, commission_rate, commission_amount, status
            ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [affiliate.id, dbOrderId, saleAmount, commissionRate, commissionAmount, 'approved']);

        // 6. Update Affiliate Balance
        console.log("📈 Updating affiliate balance...");
        await client.query(`
            UPDATE affiliates 
            SET total_sales = total_sales + $1,
                total_commission = total_commission + $2,
                available_balance = available_balance + $2
            WHERE id = $3
        `, [saleAmount, commissionAmount, affiliate.id]);

        await client.query('COMMIT');
        console.log(`\n✅ SUCCESS! Manual sale injected.`);
        console.log(`-----------------------------------`);
        console.log(`Affiliate: ${affiliate.name}`);
        console.log(`Sale: ₹${saleAmount}`);
        console.log(`Commission (10%): ₹${commissionAmount}`);
        console.log(`New Order ID: ${orderId}`);
        console.log(`-----------------------------------\n`);

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ DATABASE ERROR:', err.message);
        if (err.detail) console.error('Details:', err.detail);
    } finally {
        client.release();
        await pool.end();
    }
};

insertManualSale();
