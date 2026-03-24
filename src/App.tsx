import { lazy, Suspense, useState, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import analytics from '@/utils/analyticsService';
import ScrollToTop from '@/components/ScrollToTop';

// --- Lazy Load Pages ---
const Home = lazy(() => import('@/pages/Home'));
const PageViewer = lazy(() => import('@/pages/PageViewer'));
const BlogList = lazy(() => import('@/pages/BlogList'));
const BlogDetail = lazy(() => import('@/pages/BlogDetail'));
const Contact = lazy(() => import('@/pages/Contact'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const AboutUs = lazy(() => import('@/pages/AboutUs'));
const FAQ = lazy(() => import('@/pages/FAQ'));
const B2B = lazy(() => import('@/pages/B2B'));
const Shop = lazy(() => import('@/pages/Shop'));
const Cart = lazy(() => import('@/pages/Cart'));
const Checkout = lazy(() => import('@/pages/Checkout'));
const ProductDetails = lazy(() => import('@/pages/ProductDetails'));
const Account = lazy(() => import('@/pages/Account'));
const OrderSuccess = lazy(() => import('@/pages/OrderSuccess'));

// Admin Pages (Code-splitting protects chunks)
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminLogin = lazy(() => import('@/pages/admin/AdminLogin'));

const ShippingPolicy = lazy(() => import('@/pages/ShippingPolicy'));
const RefundPolicy = lazy(() => import('@/pages/RefundPolicy'));
const TermsOfService = lazy(() => import('@/pages/TermsOfService'));
const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy'));
const Alliance = lazy(() => import('@/pages/Alliance'));

// --- Premium Loading Spinner ---
const LoadingSpinner = () => (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-md z-[9999]">
        <div className="relative w-24 h-24 mb-4">
            {/* Outer Ring */}
            <div className="absolute inset-0 border-[3px] border-[#8E2A8B]/10 rounded-full"></div>
            {/* Spinning Arc */}
            <div className="absolute inset-0 border-[3px] border-[#2D1B4E] rounded-full border-t-transparent animate-spin-slow"></div>
            {/* Inner Pulsing Circle */}
            <div className="absolute inset-4 bg-gradient-to-tr from-[#2D1B4E] to-[#8E2A8B] rounded-full animate-pulse shadow-lg flex items-center justify-center text-white text-[10px] font-bold tracking-widest uppercase">
                Loading
            </div>
        </div>
        <div className="bg-gradient-to-r from-[#2D1B4E] to-[#8E2A8B] bg-clip-text text-transparent font-black text-sm tracking-widest uppercase animate-pulse">
            Kottravai
        </div>
    </div>
);

// --- Admin Route Guard ---
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
    // Check for admin session in sessionStorage
    const isAdmin = sessionStorage.getItem('kottravai_admin_session') === 'true';
    if (!isAdmin) {
        return <Navigate to="/admin/login" replace />;
    }
    return <>{children}</>;
};

function App() {
    const location = useLocation();
    const [scrolledMilestones, setScrolledMilestones] = useState<number[]>([]);

    // Track Page Views
    useEffect(() => {
        analytics.trackEvent('page_view', {
            path: location.pathname,
            search: location.search,
            title: document.title
        });
        setScrolledMilestones([]); // Reset milestones on navigation
    }, [location]);

    // Track Scroll Depth
    useEffect(() => {
        const handleScroll = () => {
            const h = document.documentElement;
            const b = document.body;
            const st = 'scrollTop';
            const sh = 'scrollHeight';
            const percent = (h[st] || b[st]) / ((h[sh] || b[sh]) - h.clientHeight) * 100;

            [25, 50, 75, 100].forEach(milestone => {
                if (percent >= milestone && !scrolledMilestones.includes(milestone)) {
                    setScrolledMilestones(prev => [...prev, milestone]);
                    analytics.trackEvent('scroll_depth', { depth: `${milestone}%` });
                }
            });
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [scrolledMilestones]);

    return (
        <>
            <ScrollToTop />
            <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
            
            {/* Wrap Routes with Suspense for Lazy Loading */}
            <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/shop" element={<Shop />} />
                    <Route path="/product/:slug" element={<ProductDetails />} />
                    <Route path="/category/:slug" element={<Shop />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/order-success" element={<OrderSuccess />} />
                    <Route path="/account" element={<Account />} />
                    <Route path="/about" element={<AboutUs />} />
                    <Route path="/alliance" element={<Alliance />} />
                    <Route path="/b2b" element={<B2B />} />
                    <Route path="/faqs" element={<FAQ />} />
                    <Route path="/services" element={<PageViewer slugUri="services" />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/shipping-policy" element={<ShippingPolicy />} />
                    <Route path="/refund-policy" element={<RefundPolicy />} />
                    <Route path="/terms-of-service" element={<TermsOfService />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />

                    {/* Blog System */}
                    <Route path="/blog" element={<BlogList />} />
                    <Route path="/blog/:slug" element={<BlogDetail />} />

                    <Route path="/advertise" element={<PageViewer slugUri="advertise" />} />
                    <Route path="/gift-cards" element={<PageViewer slugUri="gift-cards" />} />

                    {/* Dynamic Page Fallback */}
                    <Route path="/:slug" element={<PageViewer />} />

                    {/* 404 */}
                    <Route path="*" element={<NotFound />} />

                    {/* Admin Panel (Protected and Lazy Loaded) */}
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route 
                        path="/admin" 
                        element={
                            <AdminRoute>
                                <AdminDashboard />
                            </AdminRoute>
                        } 
                    />
                </Routes>
            </Suspense>
        </>
    );
}

export default App;
