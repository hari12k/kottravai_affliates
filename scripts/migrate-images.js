const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

// Initialize Supabase
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role for bypass RLS
);

// Initialize Postgres
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    console.log('🚀 Starting Image Migration...');

    try {
        const { rows: products } = await pool.query('SELECT id, name, image, images FROM products');
        console.log(`📦 Found ${products.length} products to process.`);

        for (const product of products) {
            console.log(`\n🔍 Processing: ${product.name} (ID: ${product.id})`);

            let mainImageUrl = product.image;
            let otherImageUrls = product.images || [];

            // 1. Process Main Image if it's Base64
            if (product.image && product.image.startsWith('data:image')) {
                console.log('   📤 Uploading main image...');
                mainImageUrl = await uploadBase64(product.image, `products/${product.id}/main_${Date.now()}.png`);
            }

            // 2. Process Other Images if they are Base64
            const newOtherImages = [];
            for (let i = 0; i < otherImageUrls.length; i++) {
                const img = otherImageUrls[i];
                if (img && img.startsWith('data:image')) {
                    console.log(`   📤 Uploading gallery image ${i + 1}...`);
                    const uploadedUrl = await uploadBase64(img, `products/${product.id}/gallery_${i}_${Date.now()}.png`);
                    newOtherImages.push(uploadedUrl);
                } else {
                    newOtherImages.push(img);
                }
            }

            // 3. Update Database
            await pool.query(
                'UPDATE products SET image = $1, images = $2 WHERE id = $3',
                [mainImageUrl, newOtherImages, product.id]
            );
            console.log(`✅ Updated ${product.name} with new URLs.`);
        }

        console.log('\n✨ MIGRATION COMPLETE! All images are now in Supabase Storage.');
    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        await pool.end();
    }
}

async function uploadBase64(base64String, fileName) {
    try {
        // Remove prefix (e.g., data:image/png;base64,)
        const base64Data = base64String.split(';base64,').pop();
        const buffer = Buffer.from(base64Data, 'base64');

        // Infer content type
        const contentType = base64String.split(';')[0].split(':')[1] || 'image/png';

        const { data, error } = await supabase.storage
            .from('products')
            .upload(fileName, buffer, {
                contentType: contentType,
                upsert: true
            });

        if (error) throw error;

        // Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('products')
            .getPublicUrl(data.path);

        return publicUrl;
    } catch (err) {
        console.error(`   ❌ Failed to upload ${fileName}:`, err.message);
        return base64String; // Fallback to original if failed
    }
}

migrate();
