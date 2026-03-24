import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Minus, ShoppingBag, X, CheckCircle2, ChevronRight, Truck } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';
import { useCart } from '@/context/CartContext';
import { useShipping } from '@/hooks/useShipping';
import { useProducts } from '@/context/ProductContext';
import analytics from '@/utils/analyticsService';
import toast from 'react-hot-toast';

const INDIAN_STATES = [
    "Tamil Nadu", "Karnataka", "Kerala", "Andhra Pradesh", "Telangana",
    "Delhi", "Maharashtra", "Gujarat", "Rajasthan", "Uttar Pradesh",
    "Madhya Pradesh", "West Bengal", "Odisha", "Punjab", "Haryana",
    "Bihar", "Jharkhand", "Chhattisgarh", "Assam", "Himachal Pradesh",
    "Uttarakhand", "Goa", "Tripura", "Meghalaya", "Manipur",
    "Nagaland", "Mizoram", "Arunachal Pradesh", "Sikkim",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
    "Lakshadweep", "Puducherry", "Ladakh", "Jammu and Kashmir"
];

const Cart = () => {
    const { cart, removeFromCart, updateQuantity, cartTotal, addToCart } = useCart();
    const navigate = useNavigate();
    const [selectedState, setSelectedState] = useState('');
    const [timeLeft, setTimeLeft] = useState(274); // 4m 34s as in reference image
    const { products } = useProducts();
    const hasUnlockedFreeShipping = useRef(false);

    const { charge: shippingCost, isFree, threshold } = useShipping(cartTotal, selectedState);

    // Track Free Shipping Unlocked
    useEffect(() => {
        if (isFree && !hasUnlockedFreeShipping.current && cartTotal > 0) {
            analytics.trackEvent('free_shipping_unlocked', {
                final_cart_total: cartTotal,
                total_items: cart.length,
                source: 'cart_page'
            });
            hasUnlockedFreeShipping.current = true;
        }
    }, [isFree, cartTotal, cart.length]);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}m ${s.toString().padStart(2, '0')}s`;
    };

    return (
        <MainLayout>
            <Helmet>
                <title>Shopping Cart - Kottravai</title>
            </Helmet>

            <div className="bg-white min-h-screen py-8 md:py-12 font-sans">
                <div className="container mx-auto px-4 max-w-6xl">
                    {/* Header Section */}
                    <div className="text-center mb-8">
                        <h1 className="text-4xl md:text-5xl font-light text-gray-900 mb-4">Shopping cart</h1>
                        <nav className="flex items-center justify-center gap-2 text-sm text-gray-400">
                            <Link to="/shop" className="hover:text-black transition-colors">Shop</Link>
                            <ChevronRight size={14} />
                            <span className="text-gray-900">Shopping Cart</span>
                        </nav>
                    </div>

                    {cart.length === 0 ? (
                        <div className="text-center py-20 bg-gray-50 rounded-lg border border-gray-100">
                            <ShoppingBag size={64} className="mx-auto text-gray-300 mb-6" />
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
                            <p className="text-gray-500 mb-8">Looks like you haven't added anything yet.</p>
                            <Link to="/shop" className="inline-block bg-black text-white px-10 py-4 rounded-none font-medium hover:bg-gray-800 transition-colors uppercase tracking-widest text-sm">
                                Start Shopping
                            </Link>
                        </div>
                    ) : (
                        <div className="flex flex-col lg:flex-row gap-8">
                            {/* Left Column: Cart Items */}
                            <div className="lg:w-2/3">
                                {/* Timer Alert */}
                                <div className="flex items-center gap-3 p-4 bg-white border border-gray-100 rounded mb-8 text-sm text-gray-600">
                                    <CheckCircle2 size={18} className="text-gray-400" />
                                    <span>Your cart is saved for the next <span className="font-bold text-gray-900">{formatTime(timeLeft)}</span></span>
                                </div>

                                <div className="divide-y divide-gray-100 border-t border-gray-100">
                                    {cart.map((item) => (
                                        <div key={`${item.id}-${item.selectedVariant?.weight || 'default'}`} className="py-6 flex flex-col md:flex-row items-center gap-8">
                                            {/* Remove Button */}
                                            <button
                                                onClick={() => removeFromCart(item.id, item.selectedVariant?.weight)}
                                                className="text-gray-300 hover:text-black transition-colors"
                                            >
                                                <X size={20} />
                                            </button>

                                            {/* Product Image */}
                                            <div className="w-24 h-28 bg-gray-50 flex-shrink-0 overflow-hidden rounded">
                                                <img
                                                    src={(item.selectedVariant?.images && item.selectedVariant.images.length > 0) ? item.selectedVariant.images[0] : item.image}
                                                    alt={item.name}
                                                    className="w-full h-full object-contain"
                                                    loading="lazy"
                                                />
                                            </div>

                                            {/* Product Info */}
                                            <div className="flex-1 text-center md:text-left">
                                                <div className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-1 font-semibold">{item.category}</div>
                                                <h3 className="text-lg font-medium text-gray-900 leading-tight mb-1">{item.name}</h3>
                                                {item.selectedVariant && (
                                                    <p className="text-sm text-gray-500">{item.selectedVariant.weight}</p>
                                                )}
                                            </div>

                                            {/* Quantity Controls */}
                                            <div className="flex items-center border border-gray-200">
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1, item.selectedVariant?.weight)}
                                                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30"
                                                    disabled={item.quantity <= 1}
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1, item.selectedVariant?.weight)}
                                                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-50"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>

                                            {/* Item Price */}
                                            <div className="text-right min-w-[100px] font-medium text-gray-900 whitespace-nowrap">
                                                {item.quantity} x ₹{item.price}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Special Instructions */}
                                <div className="mt-8">
                                    <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-black transition-colors group">
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400 group-hover:bg-black" />
                                        Special instruction for seller
                                    </button>
                                </div>
                            </div>

                            {/* Right Column: Order Summary */}
                            <div className="lg:w-1/3">
                                <div className="bg-white p-6 border border-gray-100 rounded shadow-sm sticky top-24">
                                    <h2 className="text-2xl font-light text-gray-900 mb-8">Summary</h2>

                                    {/* --- DYNAMIC FREE SHIPPING PROGRESS BAR --- */}
                                    {selectedState && (() => {
                                        const currentThreshold = threshold || 999;
                                        const actualIsFree = cartTotal >= currentThreshold;
                                        const actualRemaining = actualIsFree ? 0 : currentThreshold - cartTotal;
                                        const progress = Math.min(100, (cartTotal / currentThreshold) * 100);

                                        return (
                                            <div className="mb-10 bg-gray-50/50 p-5 rounded-xl border border-gray-100 shadow-sm transition-all duration-300">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`p-1.5 rounded-lg ${actualIsFree ? 'bg-green-100' : 'bg-purple-100'}`}>
                                                            <Truck size={14} className={actualIsFree ? 'text-green-600' : 'text-[#8E2A8B]'} />
                                                        </div>
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                                                            {actualIsFree ? "Benefit Active" : "Shipping Progress"}
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] font-black text-[#8E2A8B] bg-purple-100 px-2.5 py-1 rounded-full border border-purple-200 shadow-sm uppercase tracking-tighter">
                                                        {actualIsFree ? "FREE" : `₹${currentThreshold} TARGET`}
                                                    </span>
                                                </div>

                                                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mb-4 shadow-inner">
                                                    <div
                                                        className={`h-full transition-all duration-1000 ease-out rounded-full ${actualIsFree ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-[#8E2A8B] shadow-[0_0_10px_rgba(142,42,139,0.3)]'}`}
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>

                                                {!actualIsFree ? (
                                                    <div className="flex flex-col items-center gap-4">
                                                        <div className="text-center">
                                                            <p className="text-xs font-semibold text-gray-700">
                                                                Almost there! Add <span className="text-[#8E2A8B] font-black">₹{actualRemaining}</span> for <span className="text-green-600 font-black">Free Shipping</span>
                                                            </p>
                                                        </div>

                                                        {/* UPSELL SUGGESTION (SINGLE SMART CARD) */}
                                                        <div className="w-full pt-4 border-t border-gray-100/50">
                                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 text-center">Add to reach free shipping</p>
                                                            <div className="space-y-2">
                                                                {(() => {
                                                                    if (!products.length) return null;
                                                                    const eligible = products.filter(p => !cart.some(item => item.id === p.id) && (p.stock ?? 0) > 0);
                                                                    let suggestedProduct = null;

                                                                    const underTarget = [...eligible]
                                                                        .filter(p => p.price <= actualRemaining)
                                                                        .sort((a, b) => b.price - a.price);

                                                                    if (underTarget.length > 0) {
                                                                        suggestedProduct = underTarget[0];
                                                                    } else if (eligible.length > 0) {
                                                                        suggestedProduct = [...eligible].sort((a, b) => a.price - b.price)[0];
                                                                    }

                                                                    if (!suggestedProduct) return null;

                                                                    return (
                                                                        <div key={suggestedProduct.id} className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-gray-100 group hover:border-purple-300 hover:shadow-md transition-all duration-300">
                                                                            <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-50 flex-shrink-0">
                                                                                <img src={suggestedProduct.images?.[0] || suggestedProduct.image} alt="" className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <p className="text-[10px] font-bold text-gray-900 truncate leading-tight uppercase tracking-tight">{suggestedProduct.name}</p>
                                                                                <p className="text-xs font-black text-[#8E2A8B]">₹{suggestedProduct.price}</p>
                                                                            </div>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    analytics.trackEvent('free_shipping_suggestion_click', {
                                                                                        product_id: suggestedProduct.id,
                                                                                        product_name: suggestedProduct.name,
                                                                                        product_price: suggestedProduct.price,
                                                                                        remaining_before_click: actualRemaining,
                                                                                        cart_total_before_click: cartTotal,
                                                                                        source: 'cart_page'
                                                                                    });
                                                                                    addToCart(suggestedProduct, 1);
                                                                                    toast.success(`${suggestedProduct.name} added!`);
                                                                                }}
                                                                                className="px-3 py-2 bg-purple-50 text-[#8E2A8B] text-[10px] font-black rounded-lg hover:bg-[#8E2A8B] hover:text-white transition-all transform active:scale-90 border border-purple-100 uppercase tracking-widest"
                                                                            >
                                                                                + Add
                                                                            </button>
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-center gap-2 py-1">
                                                        <CheckCircle2 size={16} className="text-green-500" />
                                                        <p className="text-xs font-black text-green-600 tracking-wide uppercase">
                                                            Free Shipping Unlocked!
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}

                                    <div className="space-y-6 mb-8">
                                        <div className="flex justify-between text-gray-600">
                                            <span className="text-sm">Subtotal</span>
                                            <span className="font-medium">₹{cartTotal}</span>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex justify-between text-gray-600">
                                                <span className="text-sm">Shipping</span>
                                                <span className="font-medium">₹{shippingCost || 0}</span>
                                            </div>
                                            <select
                                                className="w-full text-xs p-3 border border-gray-100 bg-gray-50 outline-none text-gray-500 rounded focus:border-gray-200 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xlmns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.2em] bg-[right_0.5rem_center] bg-no-repeat"
                                                value={selectedState}
                                                onChange={(e) => setSelectedState(e.target.value)}
                                            >
                                                <option value="">Select State for Shipping</option>
                                                {INDIAN_STATES.map(state => (
                                                    <option key={state} value={state}>{state}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="pt-8 border-t border-gray-100 flex justify-between items-baseline">
                                            <span className="text-lg font-medium">Total</span>
                                            <div className="text-right">
                                                <span className="text-[10px] text-gray-400 font-bold mr-2">INR</span>
                                                <span className="text-2xl font-bold text-gray-900">₹{cartTotal + (shippingCost || 0)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Coupon Section */}
                                    <div className="mb-8">
                                        <input
                                            type="text"
                                            placeholder="Enter coupon code here"
                                            className="w-full p-3 border border-gray-100 rounded text-sm outline-none focus:border-gray-200"
                                        />
                                    </div>

                                    {/* Checkout Button */}
                                    <button
                                        onClick={() => navigate('/checkout')}
                                        className="w-full bg-black text-white py-4 font-bold uppercase tracking-[0.2em] text-xs hover:bg-gray-800 transition-all shadow-lg active:scale-[0.98]"
                                    >
                                        Check Out
                                    </button>

                                    <div className="mt-6 flex flex-col items-center gap-4">
                                        <div className="flex items-center gap-2 grayscale opacity-50">
                                            <img src="/razorpay-logo.png" alt="Razorpay" className="h-4" onError={(e) => e.currentTarget.style.display = 'none'} />
                                            <span className="text-[10px] text-gray-400 font-medium tracking-widest uppercase">Secure Payments</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
};

export default Cart;
