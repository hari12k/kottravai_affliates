import { Link } from 'react-router-dom';
import { ShoppingBag, ChevronDown, X } from 'lucide-react';
import analytics from '@/utils/analyticsService';

interface FilterSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    categories: any[];
    products: any[];
    categoryCounts: Record<string, number>;
    slug?: string;
    priceRange: [number, number];
    setPriceRange: (range: [number, number]) => void;
    expandedCategory: string | null;
    setExpandedCategory: (slug: string | null) => void;
    searchQuery: string;
    totalProductsCount: number;
}

const FilterSidebar = ({
    isOpen,
    onClose,
    categories,
    products,
    categoryCounts,
    slug,
    priceRange,
    setPriceRange,
    expandedCategory,
    setExpandedCategory,
    searchQuery,
    totalProductsCount
}: FilterSidebarProps) => {
    return (
        <>
            {/* Backdrop Overlay */}
            <div
                className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            {/* Filter Panel */}
            <div
                className={`fixed z-[110] bg-white shadow-2xl transition-transform duration-300 ease-in-out overflow-y-auto custom-scrollbar
                    /* Mobile: Bottom Drawer */
                    bottom-0 left-0 w-full h-[90vh] rounded-t-[2.5rem]
                    /* Desktop: Left Panel */
                    lg:top-0 lg:left-0 lg:h-full lg:w-[320px] lg:rounded-none lg:translate-y-0
                    ${isOpen ? 'translate-y-0 lg:translate-x-0' : 'translate-y-full lg:-translate-x-full'}`}
            >
                {/* Mobile Drag Handle */}
                <div className="lg:hidden w-full flex justify-center pt-4 pb-2">
                    <div className="w-12 h-1.5 bg-gray-100 rounded-full"></div>
                </div>

                <div className="p-6 pt-2 lg:pt-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-[#b5128f] rounded-full"></div>
                            <h3 className="font-bold text-2xl text-[#2D1B4E] tracking-tight">Filters</h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Clear All Button */}
                    {(slug || priceRange[0] !== 0 || priceRange[1] !== 3000 || searchQuery) && (
                        <div className="mb-6">
                            <Link
                                to="/shop"
                                className="block w-full py-3 rounded-xl border border-[#b5128f]/20 text-center text-xs font-black uppercase tracking-widest text-[#b5128f] hover:bg-[#b5128f]/5 transition-colors"
                                onClick={() => {
                                    setPriceRange([0, 3000]);
                                    setExpandedCategory(null);
                                    onClose();
                                }}
                            >
                                Clear All Filters
                            </Link>
                        </div>
                    )}

                    {/* Categories Section */}
                    <div className="mb-10">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 px-1">Categories</h4>
                        <ul className="space-y-2">
                            <li className="group/item">
                                <Link to="/shop"
                                    className={`flex justify-between items-center p-3 rounded-xl transition-all duration-300 ${!slug ? 'bg-[#b5128f]/10 text-[#b5128f]' : 'text-[#2D1B4E] hover:bg-gray-50'}`}
                                    onClick={() => {
                                        setExpandedCategory(null);
                                        analytics.trackEvent('filter_used', { type: 'category', value: 'all' });
                                        onClose();
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-1.5 rounded-lg transition-colors ${!slug ? 'bg-[#b5128f]/10' : 'bg-gray-100 group-hover/item:bg-white'}`}>
                                            <ShoppingBag size={16} className={!slug ? 'text-[#b5128f]' : 'text-gray-400'} />
                                        </div>
                                        <span className={`font-bold text-sm ${!slug ? 'text-[#b5128f]' : 'text-gray-700'}`}>All Products</span>
                                    </div>
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${!slug ? 'bg-[#b5128f] text-white' : 'bg-gray-100 text-gray-400'}`}>
                                        {products.length}
                                    </span>
                                </Link>
                            </li>

                            {/* Recursive Category Rendering */}
                            <CategoryTree 
                                categories={categories} 
                                parentSlug={null} 
                                currentSlug={slug} 
                                counts={categoryCounts} 
                                expandedCategory={expandedCategory} 
                                setExpandedCategory={setExpandedCategory} 
                                onClose={onClose} 
                            />
                        </ul>
                    </div>

                    {/* Price Range Section */}
                    <div className="mb-10">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6 px-1">Price Range</h4>
                        <div className="px-1">
                            <div className="relative pt-6 pb-2">
                                <input
                                    type="range"
                                    min="0" max="3000"
                                    step="10"
                                    value={priceRange[1]}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        setPriceRange([priceRange[0], val]);
                                        analytics.trackEvent('filter_used', { type: 'price_range', max_price: val });
                                    }}
                                    className="w-full accent-[#b5128f] h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#b5128f]/20 transition-all"
                                />
                                <div className="flex justify-between mt-4">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Min Price</span>
                                        <div className="flex items-center text-sm font-bold text-[#2D1B4E] bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                            <span className="text-gray-400 mr-1 text-[10px]">₹</span>
                                            <input type="number" value={priceRange[0]} onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])} className="bg-transparent border-none p-0 focus:ring-0 w-12 text-sm" />
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Max Price</span>
                                        <div className="flex items-center text-sm font-bold text-[#b5128f] bg-[#b5128f]/5 px-3 py-1.5 rounded-lg border border-[#b5128f]/10">
                                            <span className="mr-1 text-[10px]">₹</span>
                                            <input type="number" value={priceRange[1]} onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 0])} className="bg-transparent border-none p-0 focus:ring-0 w-16 text-sm text-right font-black" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-full mt-6 py-4 bg-[#2D1B4E] text-white rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-[#2D1B4E]/10"
                            >
                                Show {totalProductsCount} Products
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

// Recursive Category Component
const CategoryTree = ({ 
    categories, 
    parentSlug, 
    currentSlug, 
    counts, 
    expandedCategory, 
    setExpandedCategory, 
    onClose,
    level = 0
}: { 
    categories: any[], 
    parentSlug: string | null, 
    currentSlug: string | undefined, 
    counts: Record<string, number>, 
    expandedCategory: string | null, 
    setExpandedCategory: (s: string | null) => void, 
    onClose: () => void,
    level?: number
}) => {
    const parentCats = categories.filter(c => (parentSlug === null ? !c.parent : c.parent === parentSlug));
    
    if (parentCats.length === 0) return null;

    return (
        <div className={level > 0 ? `pl-4 mt-1 border-l border-gray-100 ml-1` : "space-y-1"}>
            {parentCats.map((cat) => {
                const isExpanded = expandedCategory === cat.slug;
                const isActive = currentSlug === cat.slug;
                const children = categories.filter(c => c.parent === cat.slug);
                const hasChildren = children.length > 0;
                const count = (counts[`p-${cat.slug}`] !== undefined) ? counts[`p-${cat.slug}`] : (counts[cat.slug] || 0);

                return (
                    <div key={cat.slug} className="pt-1">
                        <div className="group flex items-center">
                            <Link
                                to={`/category/${cat.slug}`}
                                className={`flex items-center justify-between flex-1 p-2.5 rounded-xl transition-all duration-300 ${isActive ? 'bg-[#b5128f]/10 text-[#b5128f]' : 'text-gray-700 hover:bg-gray-50'}`}
                                onClick={() => {
                                    analytics.trackEvent('filter_used', { type: level === 0 ? 'category' : 'subcategory', value: cat.slug });
                                    if (hasChildren && level === 0) {
                                        setExpandedCategory(cat.slug === expandedCategory ? null : cat.slug);
                                    } else {
                                        onClose();
                                    }
                                }}
                            >
                                <div className="flex items-center gap-2">
                                    {level > 0 && <div className={`w-1 h-1 rounded-full ${isActive ? 'bg-[#b5128f]' : 'bg-gray-300'}`}></div>}
                                    <span className={`${level === 0 ? 'font-bold text-sm' : 'text-xs'} ${isActive ? 'text-[#b5128f]' : 'text-gray-600'}`}>{cat.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${isActive ? 'bg-[#b5128f] text-white' : 'bg-gray-100 text-gray-400'}`}>
                                        {count}
                                    </span>
                                    {hasChildren && level === 0 && (
                                        <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                            <ChevronDown size={14} className={isActive ? 'text-[#b5128f]' : 'text-gray-400'} />
                                        </div>
                                    )}
                                </div>
                            </Link>
                        </div>

                        {/* Recursive Children */}
                        {hasChildren && (level === 0 ? isExpanded : true) && (
                            <CategoryTree 
                                categories={categories} 
                                parentSlug={cat.slug} 
                                currentSlug={currentSlug} 
                                counts={counts} 
                                expandedCategory={expandedCategory} 
                                setExpandedCategory={setExpandedCategory} 
                                onClose={onClose} 
                                level={level + 1}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default FilterSidebar;
