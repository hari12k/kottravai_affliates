import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import { Product, categories } from '@/data/products';
import { safeSetItem, safeGetItem } from '@/utils/storage';

const getBaseUrl = () => {
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:5000/api';
        }
        return '/api'; // Use relative path for production (proxy handles it)
    }
    return 'https://kottravai.in/api';
};

const API_URL = `${getBaseUrl()}/products`;
interface ProductContextType {
    products: Product[];
    addProduct: (product: Product) => Promise<void>;
    updateProduct: (product: Product) => Promise<void>;
    deleteProduct: (id: string) => Promise<void>;
    updateStock: (id: string, newStock: number) => void;
    addReview: (productId: string, review: any) => Promise<void>;
    categories: typeof categories;
    loading: boolean;
    getProductDetails: (slug: string) => Promise<Product>;
    fetchProducts: (force?: boolean) => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider = ({ children }: { children: ReactNode }) => {
    const [products, setProducts] = useState<Product[]>(() => {
        // Try to load from local storage for instant initial paint
        const saved = safeGetItem('kottravai_cache_products');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                return [];
            }
        }
        return [];
    });
    const [loading, setLoading] = useState(() => {
        // Only show loader if we have no cached data
        return !safeGetItem('kottravai_cache_products');
    });

    // Helper to map DB snake_case to Frontend camelCase
    const mapProductFromDB = (p: any): Product => ({
        ...p,
        id: p.id,
        categorySlug: p.category_slug || p.categorySlug,
        shortDescription: p.short_description || p.shortDescription,
        keyFeatures: p.key_features || p.keyFeatures || [],
        features: p.features || [],
        images: p.images || [],
        reviews: p.reviews || [],
        isBestSeller: p.is_best_seller || p.isBestSeller || false,
        isGiftBundleItem: p.is_gift_bundle_item || p.isGiftBundleItem || false,
        isLive: p.is_live !== undefined ? p.is_live : (p.isLive !== undefined ? p.isLive : true),
        isCustomRequest: p.is_custom_request || p.isCustomRequest || false,
        custom_form_config: p.custom_form_config || p.customFormConfig || [],
        default_form_fields: p.default_form_fields || p.defaultFormFields || [],
        createdAt: p.created_at || p.createdAt || new Date().toISOString(),
        salesCount: p.sales_count || p.salesCount || 0,
        rating: p.rating || 0,
        variants: p.variants || []
    });

    const lastFetchRef = useRef<number>(0);
    const fetchProducts = useCallback(async (force = false) => {
        // High-Efficiency Check: Use cache if it's less than 30 minutes old
        const cachedProducts = safeGetItem('kottravai_cache_products');
        const cacheTime = safeGetItem('kottravai_cache_time');
        const sessionChecked = sessionStorage.getItem('kottravai_session_checked');
        const CACHE_TTL = 5 * 60 * 1000; // 🚀 Reduced to 5 minutes for better sync

        // Throttling: Prevent fetching more than once every 30 seconds even if forced
        const recentlyFetched = Date.now() - lastFetchRef.current < 30000;

        if (!force && cachedProducts && cacheTime && sessionChecked) {
            const isFresh = Date.now() - parseInt(cacheTime) < CACHE_TTL;
            if (isFresh) {
                setProducts(JSON.parse(cachedProducts));
                setLoading(false);
                return;
            }
        }

        if (force && recentlyFetched) {
            console.log('🛡️ Throttling forced fetch - using recent data');
            return;
        }

        lastFetchRef.current = Date.now();

        try {
            const adminToken = sessionStorage.getItem('kottravai_admin_token') || sessionStorage.getItem('VITE_ADMIN_PASSWORD');
            const response = await axios.get(API_URL, {
                headers: adminToken ? { 'X-Admin-Secret': adminToken } : {}
            });
            const mappedProducts = response.data.map(mapProductFromDB);

            setProducts(mappedProducts);
            sessionStorage.setItem('kottravai_session_checked', 'true');
            // Update local storage in the background to avoid blocking the main thread
            setTimeout(() => {
                safeSetItem('kottravai_cache_products', JSON.stringify(mappedProducts));
                safeSetItem('kottravai_cache_time', Date.now().toString());
            }, 0);
        } catch (error) {
            console.error("Failed to fetch products from API", error);
            // Fallback to cache on network failure
            if (cachedProducts) setProducts(JSON.parse(cachedProducts));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();

        // Listen for storage changes from other tabs (e.g. Admin adding a product)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'kottravai_cache_products' && e.newValue) {
                try {
                    setProducts(JSON.parse(e.newValue).map(mapProductFromDB));
                } catch (err) {
                    console.error("Failed to sync products across tabs", err);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [fetchProducts]);

    const addProduct = async (product: Product) => {
        try {
            const adminToken = sessionStorage.getItem('kottravai_admin_token') || 'admin123';
            const response = await axios.post(API_URL, product, {
                headers: { 'X-Admin-Secret': adminToken }
            });
            const newProduct = mapProductFromDB(response.data);
            setProducts(prev => {
                const updated = [...prev, newProduct];
                safeSetItem('kottravai_cache_products', JSON.stringify(updated));
                return updated;
            });
        } catch (error) {
            console.error("Failed to add product", error);
            throw error;
        }
    };

    const updateProduct = async (updatedProduct: Product) => {
        try {
            const adminToken = sessionStorage.getItem('kottravai_admin_token') || 'admin123';
            const response = await axios.put(`${API_URL}/${updatedProduct.id}`, updatedProduct, {
                headers: { 'X-Admin-Secret': adminToken }
            });
            const mappedProduct = mapProductFromDB(response.data);

            if (!mappedProduct.reviews && updatedProduct.reviews) {
                mappedProduct.reviews = updatedProduct.reviews;
            }

            setProducts(prev => {
                const updated = prev.map(p => p.id === mappedProduct.id ? mappedProduct : p);
                safeSetItem('kottravai_cache_products', JSON.stringify(updated));
                return updated;
            });
        } catch (error) {
            console.error("Failed to update product", error);
            throw error;
        }
    };

    const deleteProduct = async (id: string) => {
        try {
            const adminToken = sessionStorage.getItem('kottravai_admin_token') || 'admin123';
            await axios.delete(`${API_URL}/${id}`, {
                headers: { 'X-Admin-Secret': adminToken }
            });
            setProducts(prev => {
                const updated = prev.filter(p => p.id !== id);
                safeSetItem('kottravai_cache_products', JSON.stringify(updated));
                return updated;
            });
        } catch (error) {
            console.error("Failed to delete product", error);
            throw error;
        }
    };

    const addReview = async (productId: string, review: any) => {
        try {
            const response = await axios.post('/api/reviews', { ...review, productId });
            const newReview = response.data;

            setProducts(prev => prev.map(p => {
                if (p.id === productId) {
                    return { ...p, reviews: [...(p.reviews || []), newReview] };
                }
                return p;
            }));
        } catch (error) {
            console.error("Failed to add review", error);
            throw error;
        }
    };

    const updateStock = (id: string, newStock: number) => {
        // Optimistic update for UI purposes, backend doesn't support stock yet
        setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: newStock } : p));
    };

    const getProductDetails = async (slug: string) => {
        try {
            const response = await axios.get(`${API_URL}/${slug}`);
            const fullProduct = mapProductFromDB(response.data);

            // Optimistically update the local state with full details so we don't refetch unnecessarily
            setProducts(prev => prev.map(p => p.id === fullProduct.id ? fullProduct : p));
            return fullProduct;
        } catch (error) {
            console.error("Failed to fetch product details", error);
            throw error;
        }
    };

    const contextValue = useMemo(() => ({
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        updateStock,
        addReview,
        categories,
        loading,
        getProductDetails,
        fetchProducts
    }), [products, loading, fetchProducts]);

    return (
        <ProductContext.Provider value={contextValue}>
            {children}
        </ProductContext.Provider>
    );
};

export const useProducts = () => {
    const context = useContext(ProductContext);
    if (!context) {
        throw new Error('useProducts must be used within a ProductProvider');
    }
    return context;
};