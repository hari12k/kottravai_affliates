require('dotenv').config({ path: './.env' });
const { Pool } = require('pg');

const checkAndFixProducts = async () => {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const client = await pool.connect();
        console.log('✅ Connected to DB');

        // 1. Check Columns
        const colsRes = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'products';
        `);
        const columns = colsRes.rows.map(r => r.column_name);
        console.log('Columns:', columns.join(', '));

        const hasBestSeller = columns.includes('is_best_seller');
        console.log(`Has is_best_seller: ${hasBestSeller}`);

        if (!hasBestSeller) {
            console.log('🛠 Adding is_best_seller column...');
            await client.query('ALTER TABLE products ADD COLUMN is_best_seller BOOLEAN DEFAULT FALSE;');
            console.log('✅ Column added.');
        }

        // 2. List Current Products
        const res = await client.query('SELECT id, name, is_best_seller FROM products ORDER BY name');
        console.log('\n--- Current Products ---');
        res.rows.forEach(r => {
            console.log(`[${r.is_best_seller ? '★' : ' '}] ${r.name} (${r.id})`);
        });

        // 3. Update Specific Products to Best Seller
        // We'll update based on name patterns if exact names aren't known, or just pick the first 3.
        const targetNames = ['Terracotta', 'Coconut', 'Palm']; // Keywords to look for

        console.log('\n--- Updating Best Sellers ---');
        for (const row of res.rows) {
            // Logic: If it contains target keywords, make it a best seller
            const shouldBeBestSeller = targetNames.some(k => row.name.includes(k));

            if (shouldBeBestSeller && !row.is_best_seller) {
                console.log(`> Marking "${row.name}" as Best Seller...`);
                await client.query('UPDATE products SET is_best_seller = TRUE WHERE id = $1', [row.id]);
            }
        }

        // 4. Verify Updates
        const verifyRes = await client.query('SELECT id, name, is_best_seller FROM products WHERE is_best_seller = TRUE');
        console.log('\n--- Verified Best Sellers ---');
        verifyRes.rows.forEach(r => {
            console.log(`★ ${r.name}`);
        });

        client.release();
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
};

checkAndFixProducts();
