require('dotenv').config({ path: './server/.env' });
const db = require('../server/db');

async function generateDummyData() {
    try {
        console.log('--- Starting Dummy Data Generation ---');

        // 1. Ensure we have at least 2 affiliates
        let affiliates = await db.query('SELECT id, name, email FROM affiliates LIMIT 2');
        if (affiliates.rows.length < 2) {
            console.log('Creating dummy affiliates...');
            // We need a user_id from auth.users, but we can try to insert without it if the constraint allows or use a random UUID if it's not strictly checked by DB triggers during this manual insert
            // Actually, the schema says: user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id)
            // So I should pick some existing users if possible.
            const usersRes = await db.query('SELECT id, email FROM users LIMIT 5'); // Using our 'users' table which might be different from auth.users but let's see
            
            for (let i = 0; i < 2; i++) {
                const userId = usersRes.rows[i]?.id || '00000000-0000-4000-8000-' + Math.floor(Math.random() * 999999999999).toString().padStart(12, '0');
                const name = `Dummy Affiliate ${i+1}`;
                const email = `affiliate${i+1}@example.com`;
                const refCode = `DUMMY${i+1}${Math.floor(Math.random() * 1000)}`;
                
                try {
                    await db.query(`
                        INSERT INTO affiliates (user_id, name, email, referral_code, status, level)
                        VALUES ($1, $2, $3, $4, 'Approved', 'Ambassador')
                        ON CONFLICT (email) DO NOTHING
                    `, [userId, name, email, refCode]);
                } catch (e) {
                    console.log(`Note: Affiliate ${i+1} might already exist or user_id failed: ${e.message}`);
                }
            }
            affiliates = await db.query('SELECT id, name, email FROM affiliates LIMIT 2');
        }

        // 2. Ensure we have at least 5 orders
        let orders = await db.query('SELECT id, total FROM orders LIMIT 10');
        if (orders.rows.length < 10) {
            console.log('Creating dummy orders...');
            for (let i = 0; i < 10; i++) {
                const total = (Math.random() * 2000 + 500).toFixed(2);
                await db.query(`
                    INSERT INTO orders (customer_name, customer_email, total, status, items)
                    VALUES ($1, $2, $3, 'Success', '[]')
                `, [`Customer ${i+1}`, `customer${i+1}@example.com`, total]);
            }
            orders = await db.query('SELECT id, total FROM orders LIMIT 10');
        }

        // 3. Ensure we have at least 2 links
        let links = await db.query('SELECT id, affiliate_id FROM affiliate_links LIMIT 2');
        if (links.rows.length < 2) {
            console.log('Creating dummy links...');
            for (let i = 0; i < affiliates.rows.length; i++) {
                const affId = affiliates.rows[i].id;
                const slug = `dummy-link-${i+1}-${Math.random().toString(36).substring(7)}`;
                await db.query(`
                    INSERT INTO affiliate_links (affiliate_id, slug, is_active)
                    VALUES ($1, $2, true)
                `, [affId, slug]);
            }
            links = await db.query('SELECT id, affiliate_id FROM affiliate_links LIMIT 2');
        }

        console.log(`Clean state: ${affiliates.rows.length} Affiliates, ${orders.rows.length} Orders, ${links.rows.length} Links`);

        // 4. Generate 10 Sales
        console.log('Generating 10 affiliate sales...');
        for (let i = 0; i < 10; i++) {
            const order = orders.rows[i % orders.rows.length];
            const affiliate = affiliates.rows[i % affiliates.rows.length];
            const link = links.rows.find(l => l.affiliate_id === affiliate.id) || links.rows[0];
            
            const saleAmount = parseFloat(order.total);
            const commissionRate = 10.00; // 10%
            const commissionAmount = (saleAmount * commissionRate / 100).toFixed(2);
            const status = 'approved';
            
            const saleResult = await db.query(`
                INSERT INTO affiliate_sales (affiliate_id, order_id, link_id, sale_amount, commission_rate, commission_amount, status, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() - INTERVAL '${i} days')
                RETURNING id
            `, [affiliate.id, order.id, link.id, saleAmount, commissionRate, commissionAmount, status]);
            
            // Update affiliate balance
            await db.query(`
                UPDATE affiliates 
                SET total_sales = total_sales + $1,
                    total_commission = total_commission + $2,
                    available_balance = available_balance + $2
                WHERE id = $3
            `, [saleAmount, commissionAmount, affiliate.id]);

            // Link order to affiliate (optional but good for consistency)
            await db.query(`
                UPDATE orders SET affiliate_id = $1 WHERE id = $2
            `, [affiliate.id, order.id]);

            console.log(`Created Sale ${i+1}: ID ${saleResult.rows[0].id} for Affiliate ${affiliate.name}`);
        }

        console.log('--- Successfully generated 10 dummy sales ---');
    } catch (err) {
        console.error('Error generating dummy data:', err);
    } finally {
        process.exit();
    }
}

generateDummyData();
