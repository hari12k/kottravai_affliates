const supabase = require('../server/supabase');

async function checkAndUpdate() {
    console.log('🔍 Listing all products and categories in DB...');
    const { data: products, error } = await supabase
        .from('products')
        .select('id, name, category, category_slug');
    
    if (error) {
        console.error('❌ Error fetching products:', error);
        return;
    }

    if (!products || products.length === 0) {
        console.log('✅ No products found in DB.');
        return;
    }

    let updatedCount = 0;
    for (const p of products) {
        console.log(`- ${p.name}: [${p.category}] ([${p.category_slug}])`);
        
        if (p.category === 'Handwoven Crochet' || p.category_slug === 'handwoven-crochet') {
            console.log(`  🚀 Updating product: ${p.name}`);
            const { error: updateError } = await supabase
                .from('products')
                .update({
                    category: 'Modern Sling Bags',
                    category_slug: 'modern-sling-bags'
                })
                .eq('id', p.id);
            
            if (updateError) {
                console.error(`  ❌ Failed to update ${p.id}:`, updateError);
            } else {
                console.log(`  ✅ Successfully updated ${p.id}`);
                updatedCount++;
            }
        }
    }

    console.log(`\n🏁 Process complete. ${updatedCount} products updated.`);
    
    // Final check for unique categories
    const { data: finalProducts } = await supabase
        .from('products')
        .select('category, category_slug');
    
    if (finalProducts) {
        const unique = [...new Set(finalProducts.map(p => `${p.category} (${p.category_slug})`))];
        console.log('Final unique categories in DB:', unique);
    }
}

checkAndUpdate().catch(console.error);
