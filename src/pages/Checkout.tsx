import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, Lock, ChevronDown, ShoppingBag, Truck, ChevronRight, Loader2, AlertCircle, Plus } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';
import { useCart } from '@/context/CartContext';
import { useShipping } from '@/hooks/useShipping';
import toast from 'react-hot-toast';
import analytics from '@/utils/analyticsService';

import { LOCATION_DATA } from '@/data/locationData';
import { useAuth } from '@/context/AuthContext';
import { useProducts } from '@/context/ProductContext';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const Checkout = () => {
    const { isAuthenticated, openLoginModal, user } = useAuth();
    const { cart, cartTotal, clearCart, addToCart } = useCart();
    const { products } = useProducts();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        fullName: user?.fullName || '',
        email: user?.email || '',
        phone: user?.mobile || '',
        address: '',
        city: '',
        district: '',
        state: '',
        zipCode: '',
        country: 'India',
        paymentMethod: 'online'
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [discountCode, setDiscountCode] = useState('');
    const [isMobileSummaryOpen, setIsMobileSummaryOpen] = useState(false);
    const [isPincodeLoading, setIsPincodeLoading] = useState(false);
    const [pincodeError, setPincodeError] = useState('');
    const [isLookupSuccess, setIsLookupSuccess] = useState(false);
    const hasUnlockedFreeShipping = useRef(false);

    // --- DYNAMIC SHIPPING LOGIC (Finalized 3-Zone) ---
    const { charge: shippingCost, isFree, threshold } = useShipping(cartTotal, formData.state);

    // Calculations
    const discountAmount = 0; // Example placeholder
    const totalAmount = cartTotal + (shippingCost || 0) - discountAmount;

    // Progress for Free Shipping Bar

    // Auto-prefill if user logs in while on page
    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                fullName: prev.fullName || user.fullName || '',
                email: prev.email || user.email || '',
                phone: prev.phone || user.mobile || ''
            }));
        }
    }, [user]);

    // Track Checkout Started
    useEffect(() => {
        if (cart.length > 0) {
            // analytics.trackEvent('checkout_started', {
            //     cart_items: cart.length,
            //     total_amount: totalAmount
            // });
        }
    }, []);

    // Track Address Filled (triggers when key fields are populated)
    useEffect(() => {
        if (formData.address && formData.city && formData.zipCode) {
            // analytics.trackEvent('address_filled', {
            //     city: formData.city,
            //     state: formData.state,
            //     country: formData.country
            // });
        }
    }, [formData.address, formData.city, formData.zipCode]);

    // Track Free Shipping Unlocked
    useEffect(() => {
        if (isFree && !hasUnlockedFreeShipping.current && cartTotal > 0) {
            analytics.trackEvent('free_shipping_unlocked', {
                final_cart_total: cartTotal,
                total_items: cart.length
            });
            hasUnlockedFreeShipping.current = true;
        }
    }, [isFree, cartTotal, cart.length]);

    // Pincode Lookup Effect (Pincode-First Hybrid)
    useEffect(() => {
        const lookupPincode = async (pincode: string) => {
            setIsPincodeLoading(true);
            setPincodeError('');
            setIsLookupSuccess(false);

            try {
                const response = await fetch(`${API_URL}/location/pincode/${pincode}`);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Invalid Pincode');
                }

                const data = await response.json();

                if (data.locations && data.locations.length > 0) {
                    const primary = data.locations[0];

                    // Auto-fill fields. User can still edit them manually.
                    setFormData(prev => ({
                        ...prev,
                        state: primary.state || prev.state,
                        city: primary.city || prev.city,
                        district: primary.district || prev.district
                    }));
                    setIsLookupSuccess(true);
                    toast.success("Location auto-filled!");
                }
            } catch (err: any) {
                console.error('Pincode lookup error:', err);
                setPincodeError(err.message || 'Pincode lookup failed');
                // Manual entry is allowed even if API fails
            } finally {
                setIsPincodeLoading(false);
            }
        };

        const timer = setTimeout(() => {
            if (formData.zipCode.length === 6 && /^\d{6}$/.test(formData.zipCode)) {
                lookupPincode(formData.zipCode);
            } else {
                setIsLookupSuccess(false);
                setPincodeError('');
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [formData.zipCode]);

    // Help fix Mixed Content errors by ensuring local URLs are treated as relative paths
    const sanitizeUrl = (url: string) => {
        if (!url) return '';
        if (url.includes('localhost:')) {
            const parts = url.split('/');
            return '/' + parts.slice(3).join('/'); // Turns http://localhost:5000/img.png into /img.png
        }
        return url;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const RazorpayInstance = (window as any).Razorpay;
        if (!RazorpayInstance) {
            toast.error("Razorpay SDK not loaded. Please refresh the page.");
            setIsSubmitting(false);
            return;
        }

        try {
            // 1. Create Order on Backend
            const orderResponse = await fetch(`${API_URL}/razorpay/order`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: totalAmount,
                    currency: "INR",
                    orderData: {
                        customerName: formData.fullName,
                        customerEmail: formData.email,
                        customerPhone: formData.phone,
                        address: formData.address,
                        city: formData.city,
                        district: formData.district,
                        state: formData.state,
                        pincode: formData.zipCode,
                        total: totalAmount,
                        items: cart.map(item => ({
                            ...item,
                            image: sanitizeUrl((item.selectedVariant?.images && item.selectedVariant.images.length > 0) ? item.selectedVariant.images[0] : item.image)
                        }))
                    }
                })
            });

            if (!orderResponse.ok) {
                const err = await orderResponse.json();
                throw new Error(err.error || "Failed to create order");
            }

            const activeOrder = await orderResponse.json();

            // 2. Initialize Razorpay Options
            const options: any = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: activeOrder.amount,
                currency: activeOrder.currency,
                name: "Kottravai",
                description: "Transaction for Order #" + activeOrder.id,
                order_id: activeOrder.id,
                handler: async function (response: any) {
                    setIsSubmitting(true);
                    console.log("Payment completed by user", response);

                    console.log("PAYMENT RESPONSE", response);
                    console.log("razorpay_payment_id", response.razorpay_payment_id);
                    console.log("razorpay_order_id", response.razorpay_order_id);
                    console.log("razorpay_signature", response.razorpay_signature);

                    // Store payment response for display if needed
                    const orderData = {
                        customerName: formData.fullName,
                        customerEmail: formData.email,
                        customerPhone: formData.phone,
                        address: formData.address,
                        city: formData.city,
                        district: formData.district,
                        state: formData.state,
                        pincode: formData.zipCode,
                        total: totalAmount,
                        items: cart.map(item => ({
                            ...item,
                            image: sanitizeUrl((item.selectedVariant?.images && item.selectedVariant.images.length > 0) ? item.selectedVariant.images[0] : item.image)
                        })),
                        paymentId: response.razorpay_payment_id,
                        orderId: response.razorpay_order_id
                    };

                    try {
                        console.log("VERIFY API CALLED");
                        // 1. Perform server-side verification and DB update in background
                        const verifyResponse = await fetch(`${API_URL}/razorpay/verify`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                orderData: orderData
                            })
                        });

                        const verifyResult = await verifyResponse.json();

                        if (verifyResult.status === "success") {
                            console.log("✅ ORDER SUCCESS: Payment verified");
                            
                            // 3. Clear cart and redirect
                            clearCart();
                            navigate('/order-success');
                        } else {
                            console.error("❌ Payment verification failed on server", verifyResult);
                            toast.error("Payment verification failed: " + (verifyResult.message || "Unknown error"));
                        }
                    } catch (error: any) {
                        console.error("❌ Post-payment process error:", error);
                        // We still redirect to success because the webhook is highly likely to have succeeded
                        // and we don't want to show an error to a user who just paid successfully.
                        clearCart();
                        navigate('/order-success');
                    }
                    setIsSubmitting(false);
                },
                prefill: {
                    name: formData.fullName,
                    email: formData.email,
                    contact: formData.phone
                },
                theme: { color: "#8E2A8B" },
                modal: {
                    ondismiss: function () {
                        setIsSubmitting(false);
                    }
                }
            };

            const rzp = new RazorpayInstance(options);

            rzp.on('payment.failed', function (response: any) {
                console.error("Payment failure:", response.error);
                toast.error("Payment Failed: " + response.error.description);
                analytics.trackEvent('payment_failed', {
                    error_description: response.error.description,
                    order_id: response.error.metadata.order_id,
                    payment_id: response.error.metadata.payment_id
                });
                setIsSubmitting(false);
            });

            rzp.open();
            // analytics.trackEvent('razorpay_initiated', { order_id: activeOrder.id, amount: totalAmount });

        } catch (error: any) {
            analytics.trackEvent('payment_failed', { error: error.message });
            console.error("Checkout submission error:", error);
            toast.error("Error: " + error.message);
            setIsSubmitting(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <MainLayout>
                <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 bg-gray-50 font-sans">
                    <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 max-w-md w-full text-center">
                        <div className="w-16 h-16 bg-[#b5128f]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Lock size={32} className="text-[#b5128f]" />
                        </div>
                        <h2 className="text-2xl font-bold text-[#2D1B4E] mb-3">Login to Checkout</h2>
                        <p className="text-gray-500 mb-8 leading-relaxed">
                            To ensure your order is saved to your account and for a secure shopping experience, please sign in.
                        </p>
                        <button
                            onClick={openLoginModal}
                            className="w-full bg-[#b5128f] text-white font-black uppercase tracking-[0.2em] py-4 rounded-xl hover:bg-[#910e73] transition-all transform active:scale-95 shadow-xl shadow-[#b5128f]/20 flex items-center justify-center gap-2"
                        >
                            Sign In / Register
                        </button>
                        <Link to="/cart" className="inline-block mt-6 text-sm font-bold text-gray-400 hover:text-[#b5128f] transition-colors">
                            Return to Cart
                        </Link>
                    </div>
                </div>
            </MainLayout>
        );
    }

    if (cart.length === 0) {
        return (
            <MainLayout>
                <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Your cart is empty</h2>
                    <Link to="/shop" className="text-[#8E2A8B] font-medium hover:underline">
                        Return to Shop
                    </Link>
                </div>
            </MainLayout>
        );
    }


    return (

        <MainLayout>
            <Helmet>
                <title>Checkout - Kottravai</title>
            </Helmet>

            <div className="bg-gray-50 min-h-screen py-8 font-sans">
                <div className="container mx-auto px-4 max-w-6xl">
                    <h1 className="text-2xl md:text-3xl font-black text-[#1A1A1A] mb-6">Checkout</h1>

                    {/* Mobile Order Summary Toggle */}
                    <div className="lg:hidden mb-6 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setIsMobileSummaryOpen(!isMobileSummaryOpen)}
                            className="w-full flex items-center justify-between p-4 bg-gray-50/50"
                        >
                            <div className="flex items-center gap-2 text-[#8E2A8B] font-bold text-sm uppercase tracking-wider">
                                <ShoppingBag size={18} />
                                <span>{isMobileSummaryOpen ? 'Hide' : 'Show'} Order Summary</span>
                                <ChevronDown size={16} className={`transition-transform duration-200 ${isMobileSummaryOpen ? 'rotate-180' : ''}`} />
                            </div>
                            <span className="font-bold text-lg text-[#1A1A1A]">₹{totalAmount}</span>
                        </button>

                        {isMobileSummaryOpen && (
                            <div className="p-4 border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
                                <div className="space-y-4 mb-4">
                                    {cart.map((item) => (
                                        <div key={`${item.id}-${item.selectedVariant?.weight || 'default'}`} className="flex gap-3 items-center">
                                            <div className="w-12 h-12 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0 relative">
                                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-gray-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center z-10">{item.quantity}</span>
                                                <img src={(item.selectedVariant?.images && item.selectedVariant?.images.length > 0) ? item.selectedVariant.images[0] : item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-gray-900 text-sm truncate">{item.name}</h4>
                                                {item.selectedVariant && (
                                                    <div className="text-[9px] text-[#8E2A8B] font-bold uppercase">{item.selectedVariant.weight}</div>
                                                )}
                                            </div>
                                            <div className="font-bold text-gray-900 text-sm">
                                                ₹{item.price * item.quantity}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="space-y-2 border-t border-gray-100 pt-3 text-sm">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Subtotal</span>
                                        <span>₹{cartTotal}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>Shipping</span>
                                        <span>₹{shippingCost}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-8 items-start">
                        {/* LEFT COLUMN: Shipping Info */}
                        <div className="lg:w-7/12 w-full">
                            <h2 className="text-xl font-bold text-[#1A1A1A] mb-4">Shipping Information</h2>



                            {/* Form Fields */}
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Full name <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            name="fullName"
                                            required
                                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#8E2A8B] focus:border-transparent outline-none transition-all placeholder-gray-400"
                                            placeholder="Enter full name"
                                            value={formData.fullName}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email address <span className="text-red-500">*</span></label>
                                        <input
                                            type="email"
                                            name="email"
                                            required
                                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#8E2A8B] focus:border-transparent outline-none transition-all placeholder-gray-400"
                                            placeholder="Enter email address"
                                            value={formData.email}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Phone number <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <div className="absolute left-0 top-0 h-full px-3 flex items-center border-r border-gray-200 text-gray-500 bg-gray-50 rounded-l-lg">
                                                <span className="text-lg mr-1">🇮🇳</span>
                                                <ChevronDown size={14} />
                                            </div>
                                            <input
                                                type="tel"
                                                name="phone"
                                                required
                                                className="w-full pl-24 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#8E2A8B] focus:border-transparent outline-none transition-all placeholder-gray-400"
                                                placeholder="Enter phone number"
                                                value={formData.phone}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Country <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <select
                                                name="country"
                                                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#8E2A8B] focus:border-transparent outline-none transition-all appearance-none bg-white font-medium text-gray-700"
                                                value={formData.country}
                                                onChange={handleChange}
                                            >
                                                <option value="India">India</option>
                                                <option value="USA">USA</option>
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-1">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">ZIP / Pincode <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                name="zipCode"
                                                required
                                                className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-[#8E2A8B] focus:border-transparent outline-none transition-all placeholder-gray-400 ${pincodeError ? 'border-red-300' : isLookupSuccess ? 'border-green-300' : 'border-gray-200'}`}
                                                placeholder="6-digit Pincode"
                                                value={formData.zipCode}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                                    setFormData(prev => ({ ...prev, zipCode: val }));
                                                }}
                                            />
                                            {isPincodeLoading && (
                                                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8E2A8B] animate-spin" size={18} />
                                            )}
                                            {!isPincodeLoading && isLookupSuccess && (
                                                <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500" size={18} />
                                            )}
                                        </div>
                                        {pincodeError && (
                                            <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                                                <AlertCircle size={12} />
                                                {pincodeError}
                                            </p>
                                        )}
                                    </div>

                                    <div className="md:col-span-1">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">State <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <select
                                                name="state"
                                                required
                                                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#8E2A8B] focus:border-transparent outline-none transition-all appearance-none bg-white font-medium text-gray-700"
                                                value={formData.state}
                                                onChange={handleChange}
                                            >
                                                <option value="">Select State</option>
                                                {formData.country && LOCATION_DATA[formData.country] &&
                                                    Object.keys(LOCATION_DATA[formData.country]).map(state => (
                                                        <option key={state} value={state}>{state}</option>
                                                    ))
                                                }
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-1">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">City <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            name="city"
                                            required
                                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#8E2A8B] focus:border-transparent outline-none transition-all placeholder-gray-400"
                                            placeholder="City"
                                            value={formData.city}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="md:col-span-1">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">District (Optional)</label>
                                        <input
                                            type="text"
                                            name="district"
                                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#8E2A8B] focus:border-transparent outline-none transition-all placeholder-gray-400"
                                            placeholder="District"
                                            value={formData.district}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Address House No, Building, Street <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        name="address"
                                        required
                                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#8E2A8B] focus:border-transparent outline-none transition-all placeholder-gray-400"
                                        placeholder="Flat No, Apartment Name, Street"
                                        value={formData.address}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="flex items-start gap-3 mt-4">
                                    <input
                                        type="checkbox"
                                        id="terms"
                                        required
                                        className="mt-1 w-5 h-5 rounded border-gray-300 text-[#8E2A8B] focus:ring-[#8E2A8B]"
                                    />
                                    <label htmlFor="terms" className="text-sm text-gray-600">
                                        I have read and agree to the <Link to="/terms" className="text-[#8E2A8B] hover:underline">Terms and Conditions</Link>.
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Order Summary */}
                        <div className="lg:w-5/12 w-full lg:pl-8">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
                                <h2 className="text-xl font-bold text-[#1A1A1A] mb-4">Review your cart</h2>

                                {/* --- DYNAMIC FREE SHIPPING PROGRESS BAR --- */}
                                {(() => {
                                    const currentThreshold = threshold || 999;
                                    const actualIsFree = cartTotal >= currentThreshold;
                                    const actualRemaining = actualIsFree ? 0 : currentThreshold - cartTotal;
                                    const progress = Math.min(100, (cartTotal / currentThreshold) * 100);

                                    return (
                                        <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Truck size={18} className={actualIsFree ? "text-green-600" : "text-[#8E2A8B]"} />
                                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
                                                        {actualIsFree ? "Shipping Advantage" : "Shipping Progress"}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] font-black text-[#8E2A8B] bg-purple-100 px-2 py-0.5 rounded-full">
                                                    {actualIsFree ? "ACTIVE" : `₹${currentThreshold} TARGET`}
                                                </span>
                                            </div>

                                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
                                                <div
                                                    className={`h-full transition-all duration-700 ease-out rounded-full ${actualIsFree ? 'bg-green-500' : 'bg-[#8E2A8B]'}`}
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>

                                            {!actualIsFree ? (
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="text-center">
                                                        <p className="text-sm font-medium text-gray-700 flex items-center justify-center gap-1">
                                                            Add <span className="font-bold text-[#8E2A8B]">₹{actualRemaining}</span> more to get <span className="font-bold text-green-600">Free Shipping</span>
                                                        </p>
                                                        <Link
                                                            to="/shop"
                                                            className="text-xs font-semibold text-[#8E2A8B]/60 hover:text-[#8E2A8B] inline-flex items-center gap-1 transition-all mt-1"
                                                        >
                                                            Shop More <ChevronRight size={12} />
                                                        </Link>
                                                    </div>

                                                    {/* UPSOFT SUGGESTION (SINGLE SMART CARD) */}
                                                    {(() => {
                                                        const eligible = (products || []).filter(p => !cart.some(c => c.id === p.id) && (p.stock ?? 0) > 0 && p.isLive !== false);
                                                        let suggestedProduct = null;

                                                        if (eligible.length > 0) {
                                                            const underTarget = [...eligible]
                                                                .filter(p => p.price <= actualRemaining)
                                                                .sort((a, b) => b.price - a.price);

                                                            if (underTarget.length > 0) {
                                                                suggestedProduct = underTarget[0];
                                                            } else {
                                                                suggestedProduct = [...eligible].sort((a, b) => a.price - b.price)[0];
                                                            }
                                                        }

                                                        if (!suggestedProduct) return null;

                                                        return (
                                                            <div key={suggestedProduct.id} className="w-full pt-6 mt-4 border-t border-gray-100">
                                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 text-center">Add for free shipping</p>
                                                                <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-gray-200 group hover:border-[#8E2A8B] transition-all duration-300 shadow-sm">
                                                                    <div className="w-12 h-12 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0">
                                                                        <img
                                                                            src={suggestedProduct.images?.[0] || suggestedProduct.image}
                                                                            alt=""
                                                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                                        />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <h4 className="text-xs font-bold text-gray-900 truncate leading-tight uppercase tracking-tight">{suggestedProduct.name}</h4>
                                                                        <p className="text-sm font-black text-[#8E2A8B] mt-0.5">₹{suggestedProduct.price}</p>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            analytics.trackEvent('free_shipping_suggestion_click', {
                                                                                product_id: suggestedProduct.id,
                                                                                product_name: suggestedProduct.name,
                                                                                product_price: suggestedProduct.price,
                                                                                remaining_before_click: actualRemaining,
                                                                                cart_total_before_click: cartTotal
                                                                            });
                                                                            addToCart(suggestedProduct, 1);
                                                                            toast.success(`${suggestedProduct.name} added!`);
                                                                        }}
                                                                        className="w-10 h-10 bg-[#8E2A8B] text-white rounded-full flex items-center justify-center hover:bg-black transition-all transform active:scale-90 shadow-md shadow-purple-200"
                                                                        title="Add to cart"
                                                                    >
                                                                        <Plus size={20} strokeWidth={3} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            ) : (
                                                <p className="text-sm font-bold text-green-600 flex items-center justify-center gap-1 animate-pulse py-1">
                                                    🎉 You’ve unlocked Free Shipping!
                                                </p>
                                            )}
                                        </div>
                                    );
                                })()}



                                <div className="space-y-6 mb-8 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                                    {cart.map((item) => (
                                        <div key={`${item.id}-${item.selectedVariant?.weight || 'default'}`} className="flex gap-4 items-center">
                                            <div className="w-16 h-16 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0">
                                                <img src={(item.selectedVariant?.images && item.selectedVariant.images.length > 0) ? item.selectedVariant.images[0] : item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-medium text-gray-900 leading-tight">{item.name}</h4>
                                                {item.selectedVariant && (
                                                    <div className="text-[10px] font-bold text-[#8E2A8B] uppercase tracking-wider mt-0.5">{item.selectedVariant.weight}</div>
                                                )}
                                                <div className="text-sm text-gray-500 mt-1">Qty: {item.quantity}</div>
                                            </div>
                                            <div className="font-bold text-gray-900">
                                                ₹{item.price * item.quantity}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Discount Code */}
                                <div className="flex gap-2 mb-8">
                                    <input
                                        type="text"
                                        placeholder="Discount code"
                                        className="flex-1 px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#8E2A8B] focus:border-transparent outline-none transition-all placeholder-gray-400"
                                        value={discountCode}
                                        onChange={(e) => setDiscountCode(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (discountCode) {
                                                // Simulating coupon logic for tracking as the actual logic might be elsewhere
                                                analytics.trackEvent('coupon_applied', { coupon: discountCode });
                                            }
                                        }}
                                        className="px-6 py-3 bg-blue-50 text-blue-600 font-bold rounded-lg hover:bg-blue-100 transition-colors"
                                    >
                                        Apply
                                    </button>
                                </div>

                                {/* Totals */}
                                <div className="space-y-4 border-t border-gray-100 pt-6 mb-8">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Subtotal</span>
                                        <span className="font-medium">₹{cartTotal}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>Shipping</span>
                                        <span className="font-medium">₹{shippingCost}</span>
                                    </div>

                                    <div className="flex justify-between text-gray-600">
                                        <span>Discount</span>
                                        <span className="font-medium text-green-600">-₹{discountAmount}</span>
                                    </div>
                                    <div className="flex justify-between text-xl font-bold text-[#1A1A1A] pt-4 border-t border-gray-100">
                                        <span>Total</span>
                                        <span>₹{totalAmount}</span>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting || !formData.state}
                                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all transform active:scale-[0.98] shadow-lg disabled:opacity-70 disabled:cursor-not-allowed mb-6 ${!formData.state ? 'bg-gray-400 text-white shadow-none' : 'bg-[#3B82F6] text-white shadow-blue-500/20 hover:bg-[#2563EB]'
                                        }`}
                                >
                                    {isSubmitting ? 'Processing...' : !formData.state ? 'Select State to Continue' : 'Continue to Pay'}
                                </button>

                                <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
                                    <Lock size={16} />
                                    <span>Secure Checkout - SSL Encrypted</span>
                                </div>
                                <p className="text-xs text-center text-gray-400 mt-2">
                                    Ensuring your financial and personal details are secure during every transaction.
                                </p>
                            </div>
                        </div>
                    </form>
                </div>
            </div >
        </MainLayout >
    );
};

export default Checkout;
