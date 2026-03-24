const db = require('../db');

const products = [
    {
        id: '1',
        name: 'Handcrafted Coconut Shell Cup',
        price: 450,
        category: 'Coco Crafts',
        categorySlug: 'coco-crafts',
        image: 'https://images.unsplash.com/photo-1596436065565-dfc49cb376dc?auto=format&fit=crop&q=80&w=800',
        slug: 'handcrafted-coconut-shell-cup',
        shortDescription: 'Eco-friendly, sustainable, and handcrafted coconut shell cup perfect for your daily beverages.',
        description: 'Experience the rustic charm of nature with our Handcrafted Coconut Shell Cup. Meticulously polished and treated with natural oils, this cup is not just a vessel but a piece of art. It is perfect for serving herbal teas, coffee, or even cool refreshing drinks. Being 100% natural, it adds an earthy touch to your kitchen collection.',
        keyFeatures: [
            'Made from 100% natural and reclaimed coconut shells',
            'Handcrafted by skilled rural artisans',
            'Comes with a fitted lid and curved natural handle',
            'Stable round base for safe placement',
            'Eco-friendly, biodegradable & plastic-free',
            'Lightweight, durable & sustainably sourced',
            'Ideal for serving herbal drinks, water, and traditional beverages',
            'Perfect as rustic kitchen décor or handmade gifting',
            'Retains natural coconut shell patterns for an authentic look'
        ],
        features: [
            'Material: 100% Natural Coconut Shell',
            'Capacity: 250ml - 300ml (Approx)',
            'Finish: Polished with Natural Coconut Oil',
            'Weight: 150g',
            'Care Instructions: Hand wash only, do not use in microwave'
        ],
        images: [
            'https://images.unsplash.com/photo-1628102491629-778571d893a3?auto=format&fit=crop&q=80&w=800',
            'https://images.unsplash.com/photo-1614737662709-64eb772d1742?auto=format&fit=crop&q=80&w=800'
        ],
        reviews: []
    }
];

async function seed() {
    try {
        console.log('🌱 Starting seed...');

        // Clear existing data to avoid duplicates (optional, be careful in prod)
        await db.query('DELETE FROM reviews');
        await db.query('DELETE FROM products');

        for (const product of products) {
            console.log(`Inserting product: ${product.name}`);

            const query = `
                INSERT INTO products (
                    original_id, name, price, category, image, slug, 
                    category_slug, short_description, description, 
                    key_features, features, images
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING id
            `;

            const values = [
                product.id,
                product.name,
                product.price,
                product.category,
                product.image,
                product.slug,
                product.categorySlug,
                product.shortDescription || null,
                product.description || null,
                product.keyFeatures || [],
                product.features || [],
                product.images || []
            ];

            const res = await db.query(query, values);
            const newProductId = res.rows[0].id;

            if (product.reviews && product.reviews.length > 0) {
                for (const review of product.reviews) {
                    await db.query(`
                        INSERT INTO reviews (product_id, user_name, email, rating, comment, date)
                        VALUES ($1, $2, $3, $4, $5, $6)
                    `, [newProductId, review.userName, review.email, review.rating, review.comment, review.date]);
                }
            }
        }

        console.log('✅ Seeding complete!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
}

seed();
