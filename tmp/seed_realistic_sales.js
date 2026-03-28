const { Pool } = require('pg');
require('dotenv').config({ path: 'server/.env' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function seedRealisticData() {
    try {
        console.log("🚀 Starting Realistic Seeding...");

        // 1. Fetch Affiliates
        const affs = await pool.query('SELECT id, name FROM affiliates LIMIT 3');
        if (affs.rows.length === 0) throw new Error("No affiliates found!");
        const affiliate = affs.rows[0];

        // 2. Fetch Eligible Products
        const prods = await pool.query('SELECT id, name, price, affiliate_commission_rate, affiliate_payout_type, affiliate_fixed_amount FROM products WHERE is_affiliate_eligible = true LIMIT 5');
        if (prods.rows.length === 0) throw new Error("No affiliate-eligible products found!");

        // 3. Fetch Real Orders
        const ords = await pool.query('SELECT id FROM orders LIMIT 5');
        if (ords.rows.length === 0) throw new Error("No orders found to link!");

        // 4. Clean old dummy sales (optional, but keep it clean)
        // await pool.query("DELETE FROM affiliate_sales WHERE status = 'Completed'");

        for (let i = 0; i < prods.rows.length; i++) {
            const product = prods.rows[i];
            const order = ords.rows[i % ords.rows.length];
            
            // Create a Link if not exists
            const linkSlug = `ref-${product.name.toLowerCase().replace(/\s+/g, '-')}-${i}`;
            const linkRes = await pool.query(
                'INSERT INTO affiliate_links (affiliate_id, product_id, slug) VALUES ($1, $2, $3) ON CONFLICT (slug) DO UPDATE SET slug = EXCLUDED.slug RETURNING id',
                [affiliate.id, product.id, linkSlug]
            );
            const linkId = linkRes.rows[0].id;

            // Calculate Commission
            let rate = parseFloat(product.affiliate_commission_rate || 10);
            let commissionAmount = 0;
            if (product.affiliate_payout_type === 'fixed') {
                commissionAmount = parseFloat(product.affiliate_fixed_amount || 0);
                rate = 0; // It's fixed
            } else {
                commissionAmount = (parseFloat(product.price) * rate) / 100;
            }

            // Insert Realistic Sale record
            await pool.query(
                `INSERT INTO affiliate_sales (affiliate_id, order_id, link_id, sale_amount, commission_rate, commission_amount, status) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    affiliate.id, 
                    order.id, 
                    linkId, 
                    product.price, 
                    rate, 
                    commissionAmount, 
                    'Completed'
                ]
            );
            console.log(`✅ Recorded sale for ${product.name}: ₹${product.price} -> ₹${commissionAmount} commission`);
        }

        console.log("🏁 Realistic Seeding Finished Successfully!");
        process.exit();
    } catch (err) {
        console.error("❌ Seeding Error:", err.message);
        process.exit(1);
    }
}

seedRealisticData();
