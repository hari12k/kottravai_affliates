import { Link } from 'react-router-dom';
import { ChevronUp, HelpCircle, LayoutDashboard, ShieldCheck } from 'lucide-react';
import { useState, useEffect } from 'react';

const Footer = () => {
    const [showScrollTop, setShowScrollTop] = useState(false);

    useEffect(() => {
        const checkScroll = () => {
            if (window.scrollY > 300) {
                setShowScrollTop(true);
            } else {
                setShowScrollTop(false);
            }
        };

        window.addEventListener('scroll', checkScroll);
        return () => window.removeEventListener('scroll', checkScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <footer className="bg-[#172337] text-white pt-10 font-sans tracking-tight">
            <div className="mx-auto max-w-[1440px] px-8 md:px-12 lg:px-20 grid grid-cols-2 md:grid-cols-2 lg:grid-cols-12 gap-y-10 gap-x-4 pb-10 border-b border-gray-700">
                {/* ABOUT */}
                <div className="lg:col-span-2">
                    <h4 className="text-[#878787] text-[12px] font-medium mb-4 uppercase tracking-wider">About</h4>
                    <ul className="space-y-2 text-[12px] font-bold">
                        <li><Link to="/contact" className="hover:underline">Contact Us</Link></li>
                        <li><Link to="/about" className="hover:underline">About Us</Link></li>
                        <li><Link to="/blog" className="hover:underline">Kottravai Stories</Link></li>
                    </ul>
                </div>

                {/* HELP */}
                <div className="lg:col-span-2">
                    <h4 className="text-[#878787] text-[12px] font-medium mb-4 uppercase tracking-wider">Help</h4>
                    <ul className="space-y-2 text-[12px] font-bold">
                        <li><Link to="/shipping-policy" className="hover:underline">Shipping</Link></li>
                        <li><Link to="/refund-policy" className="hover:underline">Cancellation & Returns</Link></li>
                        <li><Link to="/faqs" className="hover:underline">FAQ</Link></li>
                    </ul>
                </div>

                {/* CONSUMER POLICY */}
                <div className="lg:col-span-2">
                    <h4 className="text-[#878787] text-[12px] font-medium mb-4 uppercase tracking-wider">Consumer Policy</h4>
                    <ul className="space-y-2 text-[12px] font-bold">
                        <li><Link to="/terms-of-service" className="hover:underline">Terms Of Use</Link></li>
                        <li><Link to="/privacy-policy" className="hover:underline">Privacy</Link></li>
                    </ul>
                </div>

                {/* SOCIAL */}
                <div className="lg:col-span-1">
                    <h4 className="text-[#878787] text-[12px] font-medium mb-4 uppercase tracking-wider">Social</h4>
                    <ul className="space-y-2 text-[12px] font-bold">
                        <li><a href="https://www.facebook.com/profile.php?id=61582600756315" className="hover:underline">Facebook</a></li>
                        <li><a href="https://x.com/kottravai_in" className="hover:underline">X</a></li>
                        <li><a href="https://www.youtube.com/@Kottravai_in" className="hover:underline">YouTube</a></li>
                        <li><a href="https://www.instagram.com/kottravai_in/" className="hover:underline">Instagram</a></li>
                        <li><a href="https://in.linkedin.com/company/kottravai" className="hover:underline">LinkedIn</a></li>
                    </ul>
                </div>

                {/* MAIL US */}
                <div className="border-l border-gray-700 pl-8 hidden lg:block lg:col-span-2 col-start-8">
                    <h4 className="text-[#878787] text-[12px] font-medium mb-4 uppercase tracking-wider">Mail Us:</h4>
                    <div className="text-[12px] leading-relaxed space-y-1">
                        <p>Vazhai Incubator,</p>
                        <p>S Veerasamy Chettiar College,</p>
                        <p>Puliyangudi - 627855,</p>
                        <p>Tamil Nadu, India</p>
                    </div>
                </div>

                {/* REGISTERED OFFICE */}
                <div className="hidden lg:block pl-16 lg:col-span-3">
                    <h4 className="text-[#878787] text-[12px] font-medium mb-4 uppercase tracking-wider">Registered Office Address:</h4>
                    <div className="text-[12px] leading-relaxed space-y-1">
                        <p>KOTTRAVAI ENTERPRISES PRIVATE LIMITED,</p>
                        <p>Vazhai Incubator,</p>
                        <p>S Veerasamy Chettiar College,</p>
                        <p>Puliyangudi - 627855,</p>
                        <p>Tamil Nadu, India</p>
                        <p>Telephone: <a href="tel:+919787030811" className="text-[#2874f0] font-bold hover:underline">+91 97870 30811</a></p>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="mx-auto max-w-[1440px] px-8 md:px-12 lg:px-20 py-6 flex flex-wrap items-center justify-between gap-6 text-[14px]">
                <div className="flex flex-wrap items-center gap-8">
                    <Link
                        to="/alliance"
                        className="flex items-center gap-2 hover:text-[#2874f0] transition-all group"
                    >
                        <LayoutDashboard size={16} className="text-[#FFD700] group-hover:scale-110 transition-transform" />
                        <span>Join our Alliance</span>
                    </Link>

                    <Link
                        to="/affiliate/dashboard"
                        className="flex items-center gap-2 hover:text-[#2874f0] transition-all group"
                    >
                        <ShieldCheck size={16} className="text-[#FFD700] group-hover:scale-110 transition-transform" />
                        <span>Partner Portal</span>
                    </Link>

                    <Link to="/faqs" className="flex items-center gap-2 hover:text-[#2874f0] transition-colors">
                        <HelpCircle size={16} className="text-[#FFD700]" />
                        <span>Help Center</span>
                    </Link>
                </div>

                <div className="flex items-center gap-8">
                    <p>© 2025-2026 KOTTRAVAI ENTERPRISES PRIVATE LIMITED</p>
                </div>
            </div>

            {/* Scroll To Top Button */}
            {showScrollTop && (
                <button
                    onClick={scrollToTop}
                    className="fixed bottom-24 right-8 w-12 h-12 bg-white text-[#172337] rounded-full flex items-center justify-center shadow-xl transition-all z-[90] hover:scale-110 active:scale-95 border border-gray-200"
                    aria-label="Scroll to top"
                >
                    <ChevronUp size={24} />
                </button>
            )}
        </footer>
    );
};

export default Footer;
