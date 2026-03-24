import { useProducts } from '@/context/ProductContext';
import { Link } from 'react-router-dom';

const GiftHampers = () => {
    const { products, loading } = useProducts();

    // Fetch specifically curated kits/hampers (Only Live)
    const curatedHampers = products
        .filter(p => p.isLive !== false && (p.categorySlug === 'signature-kits' || p.category === 'Signature Kits'))
        .slice(0, 3);

    if (!loading && curatedHampers.length === 0) {
        return null; // Don't show empty section
    }

    return (
        <section className="py-20 bg-gray-50">
            <div className="container mx-auto px-4 max-w-[1240px]">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12">
                    <div>
                        <span className="text-[#8E2A8B] font-bold uppercase tracking-wider text-sm">Special Collections</span>
                        <h2 className="text-3xl md:text-5xl font-black text-gray-900 mt-2">Curated Gift Hampers</h2>
                    </div>
                    <Link to="/category/signature-kits" className="hidden md:inline-flex items-center text-[#8E2A8B] font-semibold hover:underline mt-4 md:mt-0">
                        View All Collections &rarr;
                    </Link>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {loading ? (
                        [...Array(3)].map((_, i) => (
                            <div key={i} className="h-80 bg-gray-200 rounded-xl animate-pulse"></div>
                        ))
                    ) : (
                        curatedHampers.map((item, index) => (
                            <div key={item.id} className="group relative rounded-xl overflow-hidden shadow-md h-80">
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8">
                                    <span className="text-white/80 text-xs font-bold uppercase tracking-widest mb-2">Signature Kit 0{index + 1}</span>
                                    <h3 className="text-2xl font-bold text-white mb-4">{item.name}</h3>
                                    <Link to={`/product/${item.slug}`} className="text-white text-sm font-semibold border-b border-white pb-1 inline-block w-max hover:text-[#8E2A8B] hover:border-[#8E2A8B] transition-colors">
                                        Explore Now
                                    </Link>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </section>
    );
};

export default GiftHampers;
