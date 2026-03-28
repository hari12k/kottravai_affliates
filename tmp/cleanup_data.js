const { Pool } = require('pg');
require('dotenv').config({ path: 'server/.env' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function cleanupDummyData() {
    try {
        console.log("🧹 Starting Cleanup...");

        // 1. Delete all records from affiliate_sales
        const salesRes = await pool.query('DELETE FROM affiliate_sales');
        console.log(`✅ Removed ${salesRes.rowCount} sales records.`);

        // 2. Delete the created dummy links
        // We look for links with 'ref-' or 'link-' prefix which our scripts used
        const linksRes = await pool.query("DELETE FROM affiliate_links WHERE slug LIKE 'ref-%' OR slug LIKE 'link-%'");
        console.log(`✅ Removed ${linksRes.rowCount} dummy links.`);

        console.log("🏁 Cleanup Finished Successfully!");
        process.exit();
    } catch (err) {
        console.error("❌ Cleanup Error:", err.message);
        process.exit(1);
    }
}

cleanupDummyData();
