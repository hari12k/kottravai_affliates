import { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Filter, ShoppingBag, Heart, Search, ChevronDown, X } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';
import { useCart } from '@/context/CartContext';
import { useProducts } from '@/context/ProductContext';
import { useWishlist } from '@/context/WishlistContext';
import analytics from '@/utils/analyticsService';
import FilterSidebar from '@/components/shop/FilterSidebar';
import { getOptimizedImage, IMAGE_SIZES } from '@/utils/imageOptimizer';
import axios from 'axios';

const Shop = () => {
    const { slug } = useParams();
    const { addToCart, cart, removeFromCart } = useCart();
    const { products: contextProducts, categories, loading: productsLoading } = useProducts();
    const { toggleWishlist, isInWishlist } = useWishlist();

    // Category Filtering Pre-computation (Moved up used by fetch effects)
    const validSlugs = useMemo(() => {
        if (!slug) return [];
        const getAncestry = (currentSlug: string): string[] => {
            const results = [currentSlug];
            categories.filter(c => c.parent === currentSlug).forEach(child => {
                results.push(...getAncestry(child.slug));
            });
            return results;
        };
        return getAncestry(slug);
    }, [slug, categories]);

    const [products, setProducts] = useState<any[]>([]);
    const [isFetchingLocal, setIsFetchingLocal] = useState(true);
    const [searchParams] = useSearchParams();
    const searchQuery = searchParams.get('search')?.toLowerCase() || '';

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 12;

    // Default price range 50 - 1000
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 3000]);
    const [sortBy, setSortBy] = useState('default');
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isSortDrawerOpen, setIsSortDrawerOpen] = useState(false);

    // Calculate Dynamic Category Counts
    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = {};

        // 1. Initial counts for each specific sub-category
        products.forEach(product => {
            const catSlug = product.categorySlug;
            if (catSlug) {
                counts[catSlug] = (counts[catSlug] || 0) + 1;
            }
        });

        // 2. Recursive summing function
        const sumRecursive = (slug: string): number => {
            let total = counts[slug] || 0;
            const children = categories.filter(c => c.parent === slug);
            children.forEach(child => {
                total += sumRecursive(child.slug);
            });
            // We use different keys for "full sum" to avoid multiple summations
            counts[`p-${slug}`] = total;
            return total;
        };

        // 3. Process all top-level parents
        categories.filter(c => !c.parent).forEach(parent => {
            sumRecursive(parent.slug);
        });

        // 4. Also process intermediate levels (like terracotta-ornaments)
        categories.filter(c => c.parent).forEach(inter => {
            sumRecursive(inter.slug);
        });

        return counts;
    }, [products, categories]);

    // Fetch category specific products
    useEffect(() => {
        let isCurrent = true;

        const fetchProductsBySlug = async () => {
            setIsFetchingLocal(true);
            try {
                // Determine API URL 
                let baseUrl = '/api/products';
                if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                    baseUrl = 'http://localhost:5000/api/products';
                }

                let fetchedData: any[] = [];

                if (validSlugs.length > 1) {
                    // Logic: If it's a parent category, fetch all of its sub-categories in parallel
                    console.log('⚡ Parent category detected, fetching sub-categories in parallel:', validSlugs);
                    const responses = await Promise.all(
                        validSlugs.map(s => axios.get(`${baseUrl}?category_slug=${s}`))
                    );
                    fetchedData = responses.flatMap(r => r.data);
                } else {
                    // Single fetch for normal categories or all products
                    const queryUrl = slug ? `${baseUrl}?category_slug=${slug}` : baseUrl;
                    const response = await axios.get(queryUrl);
                    fetchedData = response.data;
                }

                // Deduplicate by Product ID
                const uniqueData = Array.from(new Map(fetchedData.map((p: any) => [p.id, p])).values());

                const mappedProducts = uniqueData.map((p: any) => ({
                    ...p,
                    id: p.id,
                    image: p.image,
                    categorySlug: p.category_slug || p.categorySlug,
                    shortDescription: p.short_description || p.shortDescription || p.description,
                    isBestSeller: p.is_best_seller || p.isBestSeller || false,
                    isLive: p.is_live !== undefined ? p.is_live : (p.isLive !== undefined ? p.isLive : true),
                    keyFeatures: p.key_features || p.keyFeatures || [],
                    features: p.features || [],
                    images: p.images || [],
                    reviews: p.reviews || []
                }));

                if (isCurrent) {
                    setProducts(mappedProducts);
                    console.log('✅ Final Display products (after set & de-dupe):', mappedProducts.length);
                }
            } catch (err) {
                if (isCurrent) console.error("Failed to fetch shop products", err);
            } finally {
                if (isCurrent) setIsFetchingLocal(false);
            }
        };

        fetchProductsBySlug();
        return () => { isCurrent = false; };
    }, [slug, validSlugs]);

    // Derived loading state
    const loading = productsLoading || isFetchingLocal;

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [slug, searchQuery, priceRange, sortBy]);

    // Determine current category from slug
    const currentCategory = slug ? categories.find(c => c.slug === slug) : null;

    // Use a lazy initializer or effect to set initial expanded state based on slug
    const [expandedCategory, setExpandedCategory] = useState<string | null>(() => {
        if (!slug) return null;
        // If slug is a parent, expand it
        if (categories.some(c => c.slug === slug && !c.parent)) return slug;
        // If slug is a child, expand its parent
        const child = categories.find(c => c.slug === slug && c.parent);
        return child ? child.parent! : null;
    });

    let pageTitle = 'Shop';
    if (searchQuery) {
        pageTitle = `Search Results: "${searchQuery}"`;
    } else if (currentCategory) {
        pageTitle = currentCategory.name;
    }

    // Debug logs for filters (placed after validSlugs)
    useEffect(() => {
        console.log('--- Filtering Debug ---');
        console.log('Slug from URL:', slug);
        console.log('Display products:', products);
        console.log('Valid Category Slugs:', validSlugs);

        const filtered = products.filter(p => {
            const isLiveMatch = p.isLive !== false;
            const priceMatch = (Number(p.price) >= priceRange[0] && Number(p.price) <= priceRange[1]);
            // If we fetched by category slug, we can trust the API results for that category
            const catMatch = !slug ||
                (p.categorySlug === slug) ||
                (p.categorySlug && validSlugs.includes(p.categorySlug)) ||
                (categories.some(c => validSlugs.includes(c.slug) && c.name === p.category));

            return isLiveMatch && priceMatch && catMatch;
        });

        console.log('Filtered Count:', filtered.length);
        if (products.length > 0 && filtered.length === 0) {
            console.warn('⚠️ All products were filtered out!');
            console.log('Filtering Criteria:', { priceRange, slug });
            console.log('Sample Product:', {
                name: products[0].name,
                categorySlug: products[0].categorySlug,
                category: products[0].category,
                isLive: products[0].isLive,
                price: products[0].price
            });
        }
    }, [products, slug, validSlugs, priceRange, categories]);

    // Filter Logic
    const filteredProducts = products.filter(product => {
        // Global Visibility Filter: Drafts should not show on shop
        if (product.isLive === false) return false;

        // Price Filter
        const pPrice = Number(product.price);
        if (isNaN(pPrice) || pPrice < priceRange[0] || pPrice > priceRange[1]) {
            return false;
        }

        // Search Query Filter
        if (searchQuery) {
            const matchesName = product.name.toLowerCase().includes(searchQuery);
            const matchesCategory = product.category.toLowerCase().includes(searchQuery);
            const matchesDescription = product.description?.toLowerCase().includes(searchQuery);
            if (!matchesName && !matchesCategory && !matchesDescription) return false;
        }

        // Category Filter
        if (slug) {
            // Check using categorySlug property if available (Robust)
            if (product.categorySlug) {
                return validSlugs.includes(product.categorySlug);
            }

            // Fallback: Use Name matching
            const relevantCategoryNames = categories
                .filter(c => validSlugs.includes(c.slug))
                .map(c => c.name);

            const match = relevantCategoryNames.includes(product.category);
            return match;
        }

        return true;
    });

    // Sort Logic
    const sortedProducts = [...filteredProducts].sort((a, b) => {
        if (sortBy === 'price-low') return Number(a.price) - Number(b.price);
        if (sortBy === 'price-high') return Number(b.price) - Number(a.price);
        if (sortBy === 'best-selling') return (b.salesCount || 0) - (a.salesCount || 0);
        if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
        if (sortBy === 'default') return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        return 0;
    });

    // Pagination Logic
    const indexOfLastProduct = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstProduct = indexOfLastProduct - ITEMS_PER_PAGE;
    const currentProducts = sortedProducts.slice(indexOfFirstProduct, indexOfLastProduct);
    const totalPages = Math.ceil(sortedProducts.length / ITEMS_PER_PAGE);

    const paginate = (pageNumber: number) => {
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <MainLayout>
            <Helmet>
                <title>{pageTitle} - Kottravai</title>
            </Helmet>


            <div className="container mx-auto px-4 pt-4 pb-16">
                {/* Filter Sidebar Component */}
                <FilterSidebar
                    isOpen={isFilterOpen}
                    onClose={() => setIsFilterOpen(false)}
                    categories={categories}
                    products={contextProducts}
                    categoryCounts={categoryCounts}
                    slug={slug}
                    priceRange={priceRange}
                    setPriceRange={setPriceRange}
                    expandedCategory={expandedCategory}
                    setExpandedCategory={setExpandedCategory}
                    searchQuery={searchQuery}
                    totalProductsCount={sortedProducts.length}
                />

                <div className="flex flex-col">
                    {/* Main Content - No longer restricted by sidebar on desktop */}
                    <div className="flex-1">

                        {/* Professional Skeleton Loader while fetching */}
                        {loading ? (
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 animate-pulse">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="bg-gray-100 rounded-xl h-[400px]"></div>
                                ))}
                            </div>
                        ) : !isFetchingLocal && products.length === 0 ? (
                            <div className="flex flex-col items-center justify-center text-center py-20 bg-gray-50 rounded-2xl border border-gray-100">
                                <div className="bg-white p-6 rounded-full mb-6 relative shadow-sm">
                                    <ShoppingBag size={48} className="text-[#b5128f] opacity-80" />
                                </div>
                                <h2 className="text-3xl font-bold text-[#2D1B4E] mb-4">Store Launching Soon</h2>
                                <p className="text-gray-600 mb-8 max-w-md">
                                    We are adding products to our inventory. Please check back shortly.
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Header Control Bar */}
                                <div className="flex items-center justify-between mb-10 pb-6 border-b border-gray-50 px-1">
                                    {/* Left: Filters Button */}
                                    <div className="flex-1">
                                        <button
                                            onClick={() => setIsFilterOpen(true)}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-[10px] font-semibold font-montserrat uppercase tracking-widest text-brandBlack hover:text-brandPink hover:border-brandPink transition-all bg-white shadow-sm"
                                        >
                                            <Filter size={12} /> Filter
                                        </button>
                                    </div>

                                    {/* Center: Breadcrumbs */}
                                    <div className="hidden sm:flex flex-1 justify-center">
                                        <div className="flex items-center text-[10px] font-medium font-outfit uppercase tracking-[0.3em] text-gray-300">
                                            <Link to="/" className="hover:text-brandPink transition-colors">Home</Link>
                                            <span className="mx-3 text-gray-100">/</span>
                                            <Link to="/shop" className="hover:text-brandPink transition-colors">Shop</Link>
                                            {currentCategory && (
                                                <>
                                                    <span className="mx-3 text-gray-100">/</span>
                                                    <span className="text-brandPink font-bold">{currentCategory.name}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right: Sort Button */}
                                    <div className="flex-1 flex justify-end">
                                        <div className="relative">
                                            <button
                                                onClick={() => {
                                                    if (window.innerWidth < 1024) {
                                                        setIsSortDrawerOpen(true);
                                                    } else {
                                                        setIsSortOpen(!isSortOpen);
                                                    }
                                                }}
                                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-[10px] font-semibold font-montserrat uppercase tracking-widest text-brandBlack hover:text-brandPink hover:border-brandPink transition-all bg-white shadow-sm"
                                            >
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="6" y1="12" x2="18" y2="12" /><line x1="9" y1="18" x2="15" y2="18" /></svg>
                                                Sort
                                            </button>

                                            {/* Desktop Sort Popup */}
                                            {isSortOpen && (
                                                <>
                                                    <div className="fixed inset-0 z-40" onClick={() => setIsSortOpen(false)} />
                                                    <div className="absolute right-0 top-[calc(100%+8px)] w-[220px] bg-white border border-gray-100 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-300">
                                                        <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Sort By</span>
                                                        </div>
                                                        {[
                                                            { value: 'default', label: 'Newest Arrivals' },
                                                            { value: 'best-selling', label: 'Best Selling' },
                                                            { value: 'rating', label: 'Rating' },
                                                            { value: 'price-low', label: 'Price: Low → High' },
                                                            { value: 'price-high', label: 'Price: High → Low' }
                                                        ].map((option) => (
                                                            <button
                                                                key={option.value}
                                                                onClick={() => {
                                                                    setSortBy(option.value);
                                                                    setIsSortOpen(false);
                                                                    analytics.trackEvent('sort_used', { sort_by: option.value });
                                                                }}
                                                                className={`w-full text-left px-4 py-3 text-xs font-semibold transition-colors flex items-center justify-between
                                                                    ${sortBy === option.value
                                                                        ? 'text-[#b5128f] bg-[#b5128f]/5'
                                                                        : 'text-gray-700 hover:bg-gray-50 hover:text-[#b5128f]'}`}
                                                            >
                                                                {option.label}
                                                                {sortBy === option.value && (
                                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Mobile Sort Drawer */}
                                {isSortDrawerOpen && (
                                    <div className="lg:hidden fixed inset-0 z-[300]">
                                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setIsSortDrawerOpen(false)} />
                                        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] p-8 animate-in slide-in-from-bottom duration-500">
                                            <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-8" />
                                            <div className="flex justify-between items-center mb-8">
                                                <h3 className="text-2xl font-black text-[#2D1B4E] uppercase tracking-tighter">Sort By</h3>
                                                <button onClick={() => setIsSortDrawerOpen(false)} className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-500">
                                                    <X size={20} />
                                                </button>
                                            </div>
                                            <div className="space-y-2">
                                                {[
                                                    { value: 'default', label: 'Newest Arrivals' },
                                                    { value: 'best-selling', label: 'Best Selling' },
                                                    { value: 'rating', label: 'Rating' },
                                                    { value: 'price-low', label: 'Price: Low → High' },
                                                    { value: 'price-high', label: 'Price: High → Low' }
                                                ].map((option) => (
                                                    <button
                                                        key={option.value}
                                                        onClick={() => {
                                                            setSortBy(option.value);
                                                            setIsSortDrawerOpen(false);
                                                            analytics.trackEvent('sort_used', { sort_by: option.value });
                                                        }}
                                                        className={`w-full text-left p-5 rounded-2xl text-base font-bold transition-all flex items-center justify-between
                                                            ${sortBy === option.value
                                                                ? 'bg-[#b5128f] text-white shadow-lg shadow-[#b5128f]/20 scale-[1.02]'
                                                                : 'bg-gray-50 text-[#2D1B4E]'}`}
                                                    >
                                                        {option.label}
                                                        {sortBy === option.value && <X size={18} className="rotate-45" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Product Grid */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                                    {currentProducts.map((product) => {
                                        const isInCart = cart.some(item => item.id === product.id);
                                        return (
                                            <div key={product.id} className="group flex flex-col bg-white rounded-lg overflow-hidden border border-gray-100/50 relative">
                                                {/* Image Container - Square for compact height */}
                                                <div className="relative aspect-square overflow-hidden bg-[#FAF9F6]">
                                                    <Link to={`/product/${product.slug}`} className="block w-full h-full relative">
                                                        <img
                                                            src={getOptimizedImage(product.image, IMAGE_SIZES.CARD)}
                                                            alt={product.name}
                                                            loading="lazy"
                                                            className={`w-full h-full object-cover transition-all duration-500 ${product.images && product.images.length > 0 ? 'group-hover:opacity-0' : 'group-hover:scale-105'}`}
                                                        />
                                                        {product.images && product.images.length > 0 && (
                                                            <img
                                                                src={getOptimizedImage(product.images[0], IMAGE_SIZES.CARD)}
                                                                alt={`${product.name} hover`}
                                                                loading="lazy"
                                                                className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105"
                                                            />
                                                        )}
                                                    </Link>

                                                    {/* Wishlist Button - Overlay Top Right */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            toggleWishlist(product);
                                                        }}
                                                        className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 z-20 ${isInWishlist(product.id)
                                                            ? 'bg-[#EC4899] text-white'
                                                            : 'bg-white/80 backdrop-blur-md text-gray-400 hover:bg-[#b5128f] hover:text-white'
                                                            }`}
                                                        title={isInWishlist(product.id) ? "Remove from Wishlist" : "Add to Wishlist"}
                                                    >
                                                        <Heart size={18} fill={isInWishlist(product.id) ? "currentColor" : "none"} />
                                                    </button>
                                                </div>

                                                {/* Content Area */}
                                                <div className="p-3 flex-1 flex flex-col">

                                                    {/* Price — Top */}
                                                    <div className="mb-2">
                                                        {product.isCustomRequest ? (
                                                            <span className="text-sm font-bold text-[#8E2A8B]">Price on Request</span>
                                                        ) : (product.variants && product.variants.length > 0) || Number(product.price) === 0 ? (
                                                            <span className="text-sm font-bold text-[#b5128f]">View Options</span>
                                                        ) : (
                                                            <span className="text-lg font-black text-[#2D1B4E]">₹{Number(product.price).toLocaleString('en-IN')}</span>
                                                        )}
                                                    </div>

                                                    {/* Title */}
                                                    <h3 className="text-sm font-bold text-[#2D1B4E] leading-tight mb-1 line-clamp-2 group-hover:text-[#b5128f] transition-colors">
                                                        <Link to={`/product/${product.slug}`}>{product.name}</Link>
                                                    </h3>

                                                    {/* Short Description */}
                                                    <p className="text-[10px] text-gray-400 line-clamp-1 min-h-[1rem]">
                                                        {product.shortDescription || product.description || "Premium handcrafted quality"}
                                                    </p>

                                                    {/* Spacer & Out of Stock Label */}
                                                    <div className="mt-auto pt-3">
                                                        {product.category === 'Essential Care' && (
                                                            <div className="mb-2 text-[10px] font-black uppercase tracking-tighter text-red-500 bg-red-50 py-1 px-2 rounded w-fit">
                                                                Out of Stock
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Bottom Action Row */}
                                                    <div className="flex items-center gap-2 pt-2 border-t border-gray-50">

                                                        {/* Buy Now — left, full flex */}
                                                        {product.category === 'Essential Care' ? (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    toggleWishlist(product);
                                                                }}
                                                                className={`flex-1 py-2 rounded-md border text-[10px] font-black uppercase tracking-widest text-center transition-all ${isInWishlist(product.id)
                                                                    ? 'bg-[#EC4899] border-[#EC4899] text-white'
                                                                    : 'bg-white border-gray-200 text-gray-400 hover:text-brandPink hover:border-brandPink'
                                                                    }`}
                                                            >
                                                                {isInWishlist(product.id) ? 'Saved to Wishlist' : 'Add to Wishlist'}
                                                            </button>
                                                        ) : product.isCustomRequest ? (
                                                            <Link
                                                                to={`/product/${product.slug}`}
                                                                className="flex-1 py-2 rounded-md bg-black text-white text-[10px] font-black uppercase tracking-widest text-center hover:bg-[#b5128f] transition-colors"
                                                            >
                                                                Request
                                                            </Link>
                                                        ) : (
                                                            <Link
                                                                to={`/product/${product.slug}`}
                                                                onClick={(e) => {
                                                                    if (!product.isCustomRequest && !(product.variants && product.variants.length > 0)) {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        if (!isInCart) addToCart(product);
                                                                        window.location.href = `/checkout`;
                                                                    }
                                                                }}
                                                                className="flex-1 py-2 rounded-md bg-black text-white text-[10px] font-black uppercase tracking-widest text-center hover:bg-[#2D1B4E] transition-colors"
                                                            >
                                                                Buy Now
                                                            </Link>
                                                        )}

                                                        {/* Cart icon-only — right */}
                                                        {!product.isCustomRequest && product.category !== 'Essential Care' && (
                                                            isInCart ? (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        removeFromCart(product.id);
                                                                    }}
                                                                    className="w-8 h-8 flex items-center justify-center rounded-md bg-[#b5128f] text-white hover:bg-red-500 transition-colors flex-shrink-0"
                                                                    title="Remove from Cart"
                                                                >
                                                                    <X size={14} />
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        addToCart(product);
                                                                    }}
                                                                    className={`w-8 h-8 flex items-center justify-center rounded-md border transition-colors flex-shrink-0 ${(product.variants && product.variants.length > 0) || Number(product.price) === 0
                                                                        ? 'border-gray-200 text-gray-400 cursor-default'
                                                                        : 'border-[#b5128f] text-[#b5128f] hover:bg-[#b5128f] hover:text-white'
                                                                        }`}
                                                                    title="Add to Cart"
                                                                    disabled={(product.variants && product.variants.length > 0) || Number(product.price) === 0}
                                                                >
                                                                    <ShoppingBag size={14} />
                                                                </button>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Innovation: Floating Artisanal Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex flex-col items-center mt-12 mb-6">
                                        <div className="relative group p-1 bg-white/60 backdrop-blur-3xl rounded-[2.5rem] border border-white shadow-[0_25px_60px_-15px_rgba(142,42,139,0.15)] flex items-center gap-1">
                                            {/* Previous Button */}
                                            <button
                                                onClick={() => paginate(currentPage - 1)}
                                                disabled={currentPage === 1}
                                                className="w-12 h-12 flex items-center justify-center rounded-full bg-[#FAF9F6] text-[#2D1B4E] hover:bg-[#b5128f] hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-90"
                                                title="Previous Page"
                                            >
                                                <ChevronDown size={20} className="rotate-90" />
                                            </button>

                                            {/* Pages */}
                                            <div className="flex items-center gap-1">
                                                {[...Array(totalPages)].map((_, i) => {
                                                    const pageNum = i + 1;
                                                    const isActive = currentPage === pageNum;
                                                    return (
                                                        <button
                                                            key={pageNum}
                                                            onClick={() => paginate(pageNum)}
                                                            className={`relative w-12 h-12 flex items-center justify-center text-sm font-black transition-all duration-500 rounded-full
                                                                ${isActive
                                                                    ? 'text-white'
                                                                    : 'text-gray-400 hover:text-[#b5128f] hover:bg-white'}`}
                                                        >
                                                            {isActive && (
                                                                <div className="absolute inset-0 bg-gradient-to-br from-[#b5128f] to-[#d61bab] rounded-full scale-110 animate-in zoom-in-50 duration-300"></div>
                                                            )}
                                                            <span className="relative z-10">{pageNum}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            {/* Next Button */}
                                            <button
                                                onClick={() => paginate(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                                className="w-12 h-12 flex items-center justify-center rounded-full bg-[#FAF9F6] text-[#2D1B4E] hover:bg-[#b5128f] hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-90"
                                                title="Next Page"
                                            >
                                                <ChevronDown size={20} className="-rotate-90" />
                                            </button>
                                        </div>

                                        {/* Status Text Underneath */}
                                        <div className="mt-2 text-[10px] font-black uppercase tracking-[0.3em] text-gray-300 animate-pulse">
                                            Page {currentPage} of {totalPages}
                                        </div>
                                    </div>
                                )}

                                {!isFetchingLocal && sortedProducts.length === 0 && (
                                    <div className="text-center py-20 bg-gray-50 rounded-lg">
                                        <Search className="mx-auto text-gray-300 mb-4" size={48} />
                                        <h3 className="text-xl font-bold text-gray-500 mb-2">No products found</h3>
                                        <p className="text-gray-400">Try adjusting your filters.</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default Shop;
