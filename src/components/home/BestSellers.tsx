import { useState, useRef } from 'react';
import { useProducts } from '@/context/ProductContext';
import ProductCard from './ProductCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const BestSellers = () => {
    const { products } = useProducts();
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // State for active tab filtering
    const [activeTab, setActiveTab] = useState('All Products');

    // Filter logic
    const getFilteredProducts = () => {
        // 0. Only show Live products
        let filtered = products.filter(p => p.isLive !== false);

        // 1. Filter checks if it's marked as Best Seller
        filtered = filtered.filter(p => p.isBestSeller);

        // 2. Filter by Category Tab
        if (activeTab === 'Coco Crafts') {
            filtered = filtered.filter(p => p.category === 'Coco Crafts');
        } else if (activeTab === 'Terracotta') {
            filtered = filtered.filter(p => p.category === 'Terracotta Ornaments');
        } else if (activeTab === 'Essential Care') {
            filtered = filtered.filter(p => p.category === 'Essential Care');
        }

        // Return max 8 items for a better grid display (up from 4)
        return filtered.slice(0, 8);
    };

    const displayProducts = getFilteredProducts();

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const { scrollLeft, clientWidth } = scrollContainerRef.current;
            const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
            scrollContainerRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
        }
    };

    if (!products || products.length === 0) {
        return null;
    }

    // Helper to style buttons
    const getTabClass = (tabName: string) => {
        return activeTab === tabName
            ? "text-[#8E2A8B] border-b-2 border-[#8E2A8B] pb-4 uppercase tracking-[0.2em] font-black"
            : "text-gray-400 hover:text-[#8E2A8B] pb-4 uppercase tracking-[0.2em] font-bold transition-all";
    };

    return (
        <section className="py-8 md:py-12 bg-[#FAF9F6]">
            <div className="container mx-auto px-4 max-w-[1240px]">
                <div className="text-center mb-8 px-4">
                    <p className="text-[10px] md:text-xs font-black text-[#8E2A8B] uppercase tracking-[0.5em] mb-1 opacity-70">Customer Favorites</p>
                    <h2 className="text-3xl md:text-5xl font-black text-[#1A1A1A] mb-4 tracking-tight">Best Sellers</h2>
                </div>

                {/* Tab Navigation */}
                <div className="flex justify-start md:justify-center mb-10 overflow-x-auto no-scrollbar border-b border-gray-100 px-4 md:px-0">
                    <div className="flex space-x-8 md:space-x-16 text-xs font-bold min-w-max pb-1">
                        <button onClick={() => setActiveTab('All Products')} className={getTabClass('All Products')}>Best Overall</button>
                        <button onClick={() => setActiveTab('Coco Crafts')} className={getTabClass('Coco Crafts')}>Handicrafts</button>
                        <button onClick={() => setActiveTab('Terracotta')} className={getTabClass('Terracotta')}>Terracotta</button>
                        <button onClick={() => setActiveTab('Essential Care')} className={getTabClass('Essential Care')}>Essential Care</button>
                    </div>
                </div>

                {/* Carousel Container */}
                {displayProducts.length > 0 ? (
                    <div className="relative group/carousel">
                        {/* Navigation Buttons */}
                        <button
                            onClick={() => scroll('left')}
                            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300 hover:bg-gray-50 border border-gray-100 hidden md:flex"
                        >
                            <ChevronLeft size={20} className="text-[#8E2A8B]" />
                        </button>
                        <button
                            onClick={() => scroll('right')}
                            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300 hover:bg-gray-50 border border-gray-100 hidden md:flex"
                        >
                            <ChevronRight size={20} className="text-[#8E2A8B]" />
                        </button>

                        <div
                            ref={scrollContainerRef}
                            className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory gap-4 md:gap-6 pb-8 -mx-4 px-4"
                        >
                            {displayProducts.map((product) => (
                                <div key={product.id} className="flex-shrink-0 w-[280px] sm:w-[320px] lg:w-[calc(25%-18px)] snap-start flex">
                                    <ProductCard product={product} />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-gray-200">
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No curated selections in this category yet.</p>
                    </div>
                )}

                <div className="text-center mt-12">
                    <a
                        href="/shop"
                        className="inline-block px-10 py-4 border-2 border-[#1A1A1A] text-[#1A1A1A] font-bold rounded-lg hover:bg-[#1A1A1A] hover:text-white transition-all duration-300 text-sm"
                    >
                        View All Products
                    </a>
                </div>
            </div>
        </section>
    );
};

export default BestSellers;