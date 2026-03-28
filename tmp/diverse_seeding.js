const { Pool } = require('pg');
require('dotenv').config({ path: 'server/.env' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function reseedDiverseData() {
    try {
        console.log("🚀 Starting Diverse Seeding...");

        // Clear existing sales to start clean
        await pool.query('DELETE FROM affiliate_sales');

        // 1. Fetch Affiliates
        const affs = await pool.query('SELECT id, name FROM affiliates LIMIT 3');
        if (affs.rows.length < 1) throw new Error("Need at least 1 affiliate!");
        
        // 2. Fetch Eligible Products
        const prods = await pool.query('SELECT id, name, price, affiliate_commission_rate, affiliate_payout_type, affiliate_fixed_amount FROM products WHERE is_affiliate_eligible = true LIMIT 10');
        if (prods.rows.length < 1) throw new Error("Need at least 1 affiliate-eligible product!");

        // 3. Fetch Real Orders
        const ords = await pool.query('SELECT id FROM orders LIMIT 20');
        if (ords.rows.length < 5) throw new Error("Need more orders in database!");

        let count = 0;
        const statuses = ['Completed', 'Completed', 'Completed', 'Pending', 'Cancelled'];

        for (let i = 0; i < 25; i++) {
            const aff = affs.rows[i % affs.rows.length];
            const prod = prods.rows[i % prods.rows.length];
            const order = ords.rows[i % ords.rows.length];
            const status = statuses[i % statuses.length];

            // Link slug
            const lSlug = `link-${aff.name.split(' ')[0].toLowerCase()}-${prod.name.split(' ')[0].toLowerCase()}-${i}`;
            
            // Link
            const lRes = await pool.query(
                `INSERT INTO affiliate_links (affiliate_id, product_id, slug) VALUES ($1, $2, $3) ON CONFLICT (slug) DO UPDATE SET slug = EXCLUDED.slug RETURNING id`,
                [aff.id, prod.id, lSlug]
            );
            const linkId = lRes.rows[0].id;

            // Math
            const price = parseFloat(prod.price || 0);
            const rate = parseFloat(prod.affiliate_commission_rate || 10);
            let comm = (price * rate) / 100;
            if (prod.affiliate_payout_type === 'fixed') comm = parseFloat(prod.affiliate_fixed_amount || 0);
            
            // Date (Spread over last 30 days)
            const date = new Date();
            date.setDate(date.getDate() - (i % 30));

            await pool.query(
                `INSERT INTO affiliate_sales (affiliate_id, order_id, link_id, sale_amount, commission_rate, commission_amount, status, created_at) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [aff.id, order.id, linkId, price, rate, comm, status, date]
            );
            count++;
        }

        console.log(`🏁 Diversified Seeding Complete! ${count} sales generated across various partners and products over 30 days.`);
        process.exit();
    } catch (err) {
        console.error("❌ Seeding Error:", err.message);
        process.exit(1);
    }
}

reseedDiverseData();
