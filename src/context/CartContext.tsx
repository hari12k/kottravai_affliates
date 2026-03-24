import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { Product } from '@/data/products';
import { useAuth } from './AuthContext';
import { useProducts } from './ProductContext';
import analytics from '@/utils/analyticsService';

export interface CartItem extends Product {
    quantity: number;
    selectedVariant?: import('@/data/products').ProductVariant;
}

interface CartContextType {
    cart: CartItem[];
    addToCart: (product: Product, quantity?: number, variant?: import('@/data/products').ProductVariant) => void;
    removeFromCart: (productId: string, variantWeight?: string) => void;
    updateQuantity: (productId: string, quantity: number, variantWeight?: string) => void;
    clearCart: () => void;
    cartCount: number;
    cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
    const { user, isAuthenticated } = useAuth();
    const { products } = useProducts();
    const [cartItems, setCartItems] = useState<{ id: string, quantity: number, variantWeight?: string }[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const lastLoadedKey = useRef<string | null>(null);

    // Storage key based on user session
    const storageKey = isAuthenticated && user?.username
        ? `kottravai_cart_${user.username}`
        : 'kottravai_cart_guest';

    // 1. Initial Load & Session Switch logic
    useEffect(() => {
        setIsLoaded(false);
        const storedCart = localStorage.getItem(storageKey);
        let parsed: { id: string, quantity: number, variantWeight?: string }[] = [];

        if (storedCart) {
            try {
                const raw = JSON.parse(storedCart);
                // Migrate old full-product storage if it exists, or just take id/qty
                parsed = raw.map((item: any) => ({
                    id: item.id,
                    quantity: item.quantity,
                    variantWeight: item.variantWeight
                }));
            } catch (error) {
                console.error("Failed to parse cart", error);
                parsed = [];
            }
        }

        // Logic: Merge guest cart into user cart when logging in
        if (isAuthenticated && user?.username) {
            const guestCartStr = localStorage.getItem('kottravai_cart_guest');
            if (guestCartStr) {
                try {
                    const guestCart = JSON.parse(guestCartStr);
                    if (guestCart && guestCart.length > 0) {
                        guestCart.forEach((guestItem: any) => {
                            const existing = parsed.find(item => item.id === guestItem.id && item.variantWeight === guestItem.variantWeight);
                            if (existing) {
                                existing.quantity += guestItem.quantity;
                            } else {
                                parsed.push({ id: guestItem.id, quantity: guestItem.quantity, variantWeight: guestItem.variantWeight });
                            }
                        });
                        localStorage.removeItem('kottravai_cart_guest');
                    }
                } catch (e) {
                    console.error("Failed to merge guest cart", e);
                }
            }
        }

        setCartItems(parsed);
        lastLoadedKey.current = storageKey;
        setIsLoaded(true);
    }, [storageKey, isAuthenticated, user?.username]);

    // 2. Persistent Save logic
    useEffect(() => {
        if (!isLoaded || lastLoadedKey.current !== storageKey) return;
        if (cartItems.length > 0) {
            try {
                localStorage.setItem(storageKey, JSON.stringify(cartItems));
            } catch (e) {
                console.error("Storage limit hit! Cannot save cart.", e);
            }
        } else {
            localStorage.removeItem(storageKey);
        }
    }, [cartItems, storageKey, isLoaded]);

    // 3. Hydrate Cart with full product data
    const cart: CartItem[] = cartItems
        .map(item => {
            const product = products.find((p: Product) => p.id === item.id);
            if (!product) return null;

            let price = product.price;
            let selectedVariant = undefined;

            if (item.variantWeight && product.variants) {
                selectedVariant = product.variants.find(v => v.weight === item.variantWeight);
                if (selectedVariant) {
                    price = selectedVariant.price;
                }
            }

            const cartItem: CartItem = {
                ...product,
                price,
                quantity: item.quantity,
                selectedVariant
            };

            return cartItem;
        })
        .filter((item): item is CartItem => item !== null);

    const addToCart = (product: Product, quantity = 1, variant?: import('@/data/products').ProductVariant) => {
        setCartItems(prev => {
            const existing = prev.find(item =>
                item.id === product.id &&
                (!variant || item.variantWeight === variant.weight)
            );

            if (existing) {
                return prev.map(item =>
                    (item.id === product.id && item.variantWeight === variant?.weight)
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }
            return [...prev, { id: product.id, quantity, variantWeight: variant?.weight }];
        });

        analytics.trackEvent('add_to_cart', {
            product_id: product.id,
            product_name: product.name,
            quantity,
            variant: variant?.weight,
            price: variant?.price || product.price
        });
    };

    const removeFromCart = (productId: string, variantWeight?: string) => {
        setCartItems(prev => prev.filter(item => !(item.id === productId && item.variantWeight === variantWeight)));
        analytics.trackEvent('remove_from_cart', { product_id: productId, variant_weight: variantWeight });
    };

    const updateQuantity = (productId: string, quantity: number, variantWeight?: string) => {
        if (quantity < 1) return;
        setCartItems(prev => prev.map(item =>
            (item.id === productId && item.variantWeight === variantWeight) ? { ...item, quantity } : item
        ));
        analytics.trackEvent('cart_quantity_change', { product_id: productId, new_quantity: quantity, variant_weight: variantWeight });
    };

    const clearCart = () => setCartItems([]);

    const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
    const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, cartTotal }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
