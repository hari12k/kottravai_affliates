import { useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import { useProducts } from '@/context/ProductContext';
import { useCart } from '@/context/CartContext';
import toast from 'react-hot-toast';

const GiftBundleBuilder = () => {
    const { products, loading } = useProducts();
    const { addToCart } = useCart();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Scroll Handler for Carousel
    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current;
            const scrollAmount = clientWidth * 0.8;
            const scrollTo = direction === 'left'
                ? scrollLeft - scrollAmount
                : scrollLeft + scrollAmount;
            scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
        }
    };

    // Filter only Terracotta Ornaments
    const giftItems = useMemo(() => {
        if (!products) return [];
        return products.filter(p =>
            p.isLive !== false &&
            p.category === 'Terracotta Ornaments' &&
            p.price > 0 &&
            (p.images && p.images.length > 0)
        );
    }, [products]);

    const SkeletonCard = () => (
        <div className="bg-white rounded-[24px] p-4 border border-gray-100 shadow-sm animate-pulse min-w-[280px]">
            <div className="aspect-square bg-gray-100 rounded-[16px] mb-4"></div>
            <div className="space-y-3">
                <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                <div className="h-5 bg-gray-100 rounded w-1/3"></div>
                <div className="h-10 bg-gray-100 rounded-xl w-full"></div>
            </div>
        </div>
    );

    return (
        <section className="pt-20 pb-4 bg-white">
            <div className="container mx-auto px-4 max-w-[1240px]">
                {/* Header Row */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-6">
                    <div className="text-left">
                        <h2 className="text-4xl md:text-5xl font-black text-[#1A1A1A] mb-4 tracking-tight">
                            Shop Terracotta Jewellery
                        </h2>
                        <p className="text-gray-500 font-medium max-w-xl text-lg">
                            Handcrafted terracotta ornaments made by skilled artisans.
                        </p>
                    </div>
                    <Link to="/category/terracotta-ornaments" className="group flex items-center gap-2 text-[#8E2A8B] font-bold uppercase tracking-widest text-xs hover:gap-4 transition-all pb-1">
                        View All <ArrowRight size={16} />
                    </Link>
                </div>

                <div>

                    <div className="relative group/carousel">
                        {/* Navigation Arrows */}
                        <button
                            onClick={() => scroll('left')}
                            className="absolute -left-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-xl border border-gray-100 opacity-0 group-hover/carousel:opacity-100 transition-all hover:bg-[#8E2A8B] hover:text-white"
                            aria-label="Previous items"
                        >
                            <ChevronLeft size={20} />
                        </button>

                        <div
                            ref={scrollRef}
                            className="flex gap-6 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth pb-8"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            {loading ? (
                                [...Array(6)].map((_, i) => <SkeletonCard key={i} />)
                            ) : (
                                giftItems.map((product) => (
                                    <div
                                        key={product.id}
                                        className="min-w-[280px] snap-start"
                                    >
                                        <div className="group bg-white rounded-xl p-4 border border-gray-100 shadow-sm transition-all duration-300">
                                            <Link to={`/product/${product.slug}`} className="block group">
                                                <div className="relative aspect-square overflow-hidden rounded-lg mb-4 bg-[#F8F8F8]">
                                                    <img
                                                        src={product.image || (product.images && product.images[0]) || "/placeholder.png"}
                                                        alt={product.name}
                                                        className={`w-full h-full object-cover transition-all duration-500 ${(product.images && product.images.length > 0) ? 'group-hover:opacity-0' : 'group-hover:scale-105'}`}
                                                        loading="lazy"
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.src = "/placeholder.png";
                                                        }}
                                                    />
                                                    {product.images && product.images.length > 0 && (
                                                        <img
                                                            src={product.images[0]}
                                                            alt={`${product.name} alternate view`}
                                                            className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105"
                                                            loading="lazy"
                                                        />
                                                    )}
                                                </div>
                                            </Link>
                                            <div className="space-y-2">
                                                <Link to={`/product/${product.slug}`}>
                                                    <h3 className="font-bold text-[#1A1A1A] text-base line-clamp-2 min-h-[44px] hover:text-[#8E2A8B] transition-colors">
                                                        {product.name}
                                                    </h3>
                                                </Link>
                                                <p className="text-[#8E2A8B] font-black text-lg">
                                                    ₹{product.price.toLocaleString('en-IN')}
                                                </p>
                                                <button
                                                    onClick={() => {
                                                        addToCart(product);
                                                        toast.success(`${product.name} added to cart!`);
                                                    }}
                                                    className="w-full py-3 bg-[#F8F8F8] text-[#1A1A1A] font-black text-[10px] uppercase tracking-widest rounded-lg hover:bg-[#8E2A8B] hover:text-white transition-all flex items-center justify-center gap-2"
                                                >
                                                    Add to Cart <ShoppingBag size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <button
                            onClick={() => scroll('right')}
                            className="absolute -right-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-xl border border-gray-100 opacity-0 group-hover/carousel:opacity-100 transition-all hover:bg-[#8E2A8B] hover:text-white"
                            aria-label="Next items"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    {!loading && giftItems.length === 0 && (
                        <div className="text-center py-20 bg-gray-50 rounded-[32px] border border-dashed border-gray-200">
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No items found in this category.</p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default GiftBundleBuilder;
