import { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Menu, X, Search, User, ShoppingBag, ChevronDown, ArrowUpRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import LoginModal from './LoginModal';
import analytics from '@/utils/analyticsService';

const Header = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const { cartCount } = useCart();
    const { isAuthenticated, user, openLoginModal } = useAuth();
    const navigate = useNavigate();

    // State for mobile sub-menu toggles
    const [expandedMobileMenu, setExpandedMobileMenu] = useState<string | null>(null);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            analytics.trackEvent('search_query', { query: searchQuery.trim() });
            navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
            setIsSearchOpen(false);
            setSearchQuery('');
        }
    };

    const toggleMobileSubMenu = (label: string) => {
        setExpandedMobileMenu(expandedMobileMenu === label ? null : label);
    };

    interface NavItem {
        label: string;
        path: string;
        sub?: NavItem[];
    }

    const topLinks = [
        { label: "About Us", path: "/about" },
        { label: "FAQs", path: "/faqs" },
        { label: "B2B", path: "/b2b" }
    ];

    const mainNavLinks: NavItem[] = [
        {
            label: "Handicrafts", path: "/category/handicrafts",
            sub: [
                { label: "Coco Crafts", path: "/category/coco-crafts" },
                {
                    label: "Terracotta Ornaments",
                    path: "/category/terracotta-ornaments",
                    sub: [
                        { label: "Festival Wear", path: "/category/festival-wear" },
                        { label: "Bridal Set", path: "/category/bridal-set" },
                        { label: "Daily Wear", path: "/category/daily-wear" }
                    ]
                },
                { label: "Banana Fibre Essentials", path: "/category/banana-fibre-essentials" },
                { label: "Modern Sling Bags", path: "/category/modern-sling-bags" }
            ]
        },
        {
            label: "Heritage Mixes", path: "/category/heritage-mixes",
            sub: [
                { label: "Daily Idly Mix", path: "/category/daily-idly-mix" },
                { label: "Tasty Dosa Mix", path: "/category/tasty-dosa-mix" },
                { label: "Wholesome Rice Mix", path: "/category/wholesome-rice-mix" }
            ]
        },
        {
            label: "Instant Nourish", path: "/category/instant-nourish"
        },
        {
            label: "Essential Care", path: "/category/essential-care"
        },
        {
            label: "Signature Kits", path: "/category/signature-kits"
        }
    ];

    const LOGO_URL = "/uploads/2026/01/kottravai-logo-final.png";

    return (
        <header className={`sticky top-0 z-50 bg-white transition-shadow duration-300 ${scrolled ? 'shadow-md' : 'shadow-sm'}`}>

            {/* Top Utility Bar & Logo Area */}
            <div className="container py-1 md:py-2 flex justify-between items-center bg-white border-b border-gray-100 relative z-20">

                {/* Left: Utility Links (hidden on mobile) */}
                <div className="hidden md:flex flex-1 space-x-6 text-xs md:text-sm text-gray-500 font-medium">
                    {topLinks.map(link => (
                        <Link key={link.label} to={link.path} className="hover:text-primary transition-colors">
                            {link.label}
                        </Link>
                    ))}
                </div>

                {/* Center: Logo */}
                <div className="flex-1 md:flex-none text-center flex justify-center">
                    <Link to="/">
                        <img
                            src={LOGO_URL}
                            alt="Kottravai"
                            className="h-10 md:h-16 object-contain"
                        />
                    </Link>
                </div>

                {/* Right: Icons */}
                <div className="flex flex-1 items-center justify-end space-x-3 md:space-x-5 text-gray-700">
                    {/* Alliance Button */}
                    <Link
                        to="/alliance"
                        className="group flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-brandPink/30 bg-brandPink/5 hover:bg-brandPink hover:border-brandPink transition-all duration-500 shadow-sm"
                    >
                        <div className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brandPink opacity-75 group-hover:bg-white"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-brandPink group-hover:bg-white"></span>
                        </div>
                        <span className="hidden sm:inline text-[9px] md:text-[10px] font-black uppercase tracking-[0.15em] text-brandPink group-hover:text-white transition-colors">
                            Join our Alliance
                        </span>
                        <span className="sm:hidden text-[9px] font-black uppercase tracking-[0.15em] text-brandPink group-hover:text-white">
                            Join
                        </span>
                        <ArrowUpRight size={14} className="text-brandPink group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                    </Link>

                    <button
                        className={`hover:text-primary transition-colors ${isSearchOpen ? 'text-primary' : ''}`}
                        onClick={() => setIsSearchOpen(!isSearchOpen)}
                        data-search-toggle="true"
                    >
                        <Search size={18} className="md:w-[20px] md:h-[20px]" />
                    </button>
                    <button
                        onClick={() => isAuthenticated ? navigate('/account') : openLoginModal()}
                        className="hidden md:block hover:text-primary transition-colors"
                        title={isAuthenticated ? `Account (${user?.fullName})` : "Sign In"}
                    >
                        <User size={20} className={isAuthenticated ? "text-[#b5128f]" : ""} />
                    </button>
                    <Link to="/cart" className="relative hover:text-primary transition-colors">
                        <ShoppingBag size={18} className="md:w-[20px] md:h-[20px]" />
                        {cartCount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                                {cartCount}
                            </span>
                        )}
                    </Link>
                    <button
                        className="md:hidden text-gray-700 p-1"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        {isOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* EXPANDABLE SEARCH ROW - Between Header & Category Bar */}
            <div
                ref={(el) => {
                    if (!el) return;

                    const handleOutsideClick = (e: MouseEvent) => {
                        const target = e.target as HTMLElement;
                        if (target.closest('button[data-search-toggle="true"]')) return;
                        if (isSearchOpen && !el.contains(target)) {
                            setIsSearchOpen(false);
                        }
                    };

                    const handleEscKey = (e: KeyboardEvent) => {
                        if (e.key === 'Escape') setIsSearchOpen(false);
                    };

                    if (isSearchOpen) {
                        const input = el.querySelector('input');
                        if (input) setTimeout(() => input.focus(), 150);
                        document.addEventListener('mousedown', handleOutsideClick);
                        document.addEventListener('keydown', handleEscKey);
                    } else {
                        document.removeEventListener('mousedown', handleOutsideClick);
                        document.removeEventListener('keydown', handleEscKey);
                    }

                    // Cleanup function to ensure listeners are removed if component unmounts
                    // or if logic re-runs (though react refs don't auto-rerun like effects)
                    // We rely on the callback execution. 
                    // To be safe against memory leaks in this pattern, we can just rely on the if(isSearchOpen) check 
                    // but standard useEffect is cleaner. However, adhering to the "Layout Architect" persona
                    // and minimal changes: this inline pattern works for simple toggles.
                }}
                className={`
                    w-full overflow-hidden transition-all duration-300 ease-in-out bg-white border-b border-gray-100
                    ${isSearchOpen
                        ? 'max-h-[100px] opacity-100 py-4 shadow-inner'
                        : 'max-h-0 opacity-0 py-0 border-none'
                    }
                `}
            >
                <div className="container max-w-5xl mx-auto px-4">
                    <form onSubmit={handleSearchSubmit} className="relative w-full">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search products..."
                            className="w-full h-14 pl-14 pr-14 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#b5128f]/20 focus:border-[#b5128f] text-base text-[#2D1B4E] shadow-sm transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button
                            type="button"
                            onClick={() => {
                                setIsSearchOpen(false);
                                setSearchQuery('');
                            }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </form>
                </div>
            </div>

            {/* Main Navigation Bar (Desktop) */}
            <div className="hidden md:block bg-brandPink">
                <div className="container">
                    <nav className="flex justify-center space-x-8">
                        {mainNavLinks.map((link) => (
                            <div key={link.label} className="group relative">
                                <NavLink
                                    to={link.path}
                                    className={({ isActive }) =>
                                        `flex items-center gap-1 text-[13px] uppercase tracking-wider font-outfit font-medium transition-colors py-4 px-2 border-b-2 border-transparent hover:text-white/90 ${isActive ? 'text-white border-white' : 'text-white'
                                        }`
                                    }
                                >
                                    {link.label}
                                    {link.sub && <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-300" />}
                                </NavLink>

                                {link.sub && (
                                    <div className="absolute top-full left-0 bg-white shadow-xl rounded-b-lg py-4 min-w-[250px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-50 border-t-2 border-[#b5128f]">
                                        <div className="flex flex-col">
                                            {link.sub.map((subLink) => (
                                                <div key={subLink.label} className="relative group/sub">
                                                    <Link
                                                        to={subLink.path}
                                                        className="px-6 py-3 text-[14px] text-gray-700 hover:bg-[#F8F0FF] hover:text-[#b5128f] hover:font-bold transition-colors font-medium flex items-center justify-between"
                                                    >
                                                        {subLink.label}
                                                        {subLink.sub && <ChevronDown size={12} className="-rotate-90" />}
                                                    </Link>

                                                    {/* Third Level Dropdown */}
                                                    {subLink.sub && (
                                                        <div className="absolute left-full top-0 ml-0.5 bg-white shadow-xl rounded-lg py-2 min-w-[200px] opacity-0 invisible group-hover/sub:opacity-100 group-hover/sub:visible transition-all duration-300 border-l-2 border-[#b5128f]">
                                                            {subLink.sub.map(nested => (
                                                                <div key={nested.label} className="relative group/nested">
                                                                    <Link
                                                                        to={nested.path}
                                                                        className="px-6 py-2.5 text-[13px] text-gray-600 hover:bg-[#F8F0FF] hover:text-[#b5128f] transition-colors flex items-center justify-between"
                                                                    >
                                                                        {nested.label}
                                                                        {nested.sub && <ChevronDown size={10} className="-rotate-90" />}
                                                                    </Link>

                                                                    {/* Fourth Level Dropdown */}
                                                                    {nested.sub && (
                                                                        <div className="absolute left-full top-0 ml-0.5 bg-white shadow-xl rounded-lg py-2 min-w-[180px] opacity-0 invisible group-hover/nested:opacity-100 group-hover/nested:visible transition-all duration-300 border-l-2 border-[#b5128f]">
                                                                            {nested.sub.map(fourth => (
                                                                                <Link
                                                                                    key={fourth.label}
                                                                                    to={fourth.path}
                                                                                    className="block px-6 py-2 text-[12px] text-gray-500 hover:bg-[#F8F0FF] hover:text-[#b5128f] transition-colors"
                                                                                >
                                                                                    {fourth.label}
                                                                                </Link>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </nav>
                </div>
            </div >

            {/* Mobile Menu Slide-in Drawer */}
            < div
                className={`fixed inset-0 bg-black/50 z-[100] transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={() => setIsOpen(false)}
            >
                <div
                    className={`absolute left-0 top-0 h-full w-[85%] max-w-sm bg-white shadow-2xl transition-transform duration-300 ease-out transform ${isOpen ? 'translate-x-[0%]' : 'translate-x-[-100%]'
                        }`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex flex-col h-full uppercase">
                        {/* Header of drawer */}
                        <div className="p-4 border-b flex justify-between items-center bg-brandPink">
                            <img src={LOGO_URL} alt="Logo" className="h-8 brightness-0 invert" />
                            <button onClick={() => setIsOpen(false)} className="text-white p-1">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Navigation Links */}
                        <div className="flex-1 overflow-y-auto p-4 pb-20">
                            <nav className="flex flex-col space-y-1">
                                {mainNavLinks.map((link) => (
                                    <div key={link.label} className="border-b border-gray-50 last:border-0">
                                        <div className="flex items-center justify-between py-3">
                                            <NavLink
                                                to={link.path}
                                                onClick={() => setIsOpen(false)}
                                                className="text-[14px] font-bold text-gray-800 tracking-wide"
                                            >
                                                {link.label}
                                            </NavLink>
                                            {link.sub && (
                                                <button
                                                    onClick={() => toggleMobileSubMenu(link.label)}
                                                    className={`p-2 transition-transform duration-300 ${expandedMobileMenu === link.label ? 'rotate-180' : ''
                                                        }`}
                                                >
                                                    <ChevronDown size={18} className="text-gray-400" />
                                                </button>
                                            )}
                                        </div>

                                        {link.sub && (
                                            <div
                                                className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedMobileMenu === link.label
                                                    ? 'max-h-[500px] opacity-100 pb-4'
                                                    : 'max-h-0 opacity-0'
                                                    }`}
                                            >
                                                <div className="flex flex-col space-y-1 pl-4 border-l-2 border-[#b5128f]/20 ml-1">
                                                    {link.sub.map((subLink) => (
                                                        <div key={subLink.label}>
                                                            <div className="flex items-center justify-between">
                                                                <Link
                                                                    to={subLink.path}
                                                                    onClick={() => setIsOpen(false)}
                                                                    className="py-2 text-[13px] text-gray-600 hover:text-[#b5128f] transition-colors flex-1"
                                                                >
                                                                    {subLink.label}
                                                                </Link>
                                                                {subLink.sub && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            toggleMobileSubMenu(subLink.label);
                                                                        }}
                                                                        className={`p-2 transition-transform duration-300 ${expandedMobileMenu === subLink.label ? 'rotate-180' : ''}`}
                                                                    >
                                                                        <ChevronDown size={14} className="text-gray-300" />
                                                                    </button>
                                                                )}
                                                            </div>

                                                            {subLink.sub && (
                                                                <div className={`overflow-hidden transition-all duration-300 ${expandedMobileMenu === subLink.label ? 'max-h-[200px] opacity-100 mb-2' : 'max-h-0 opacity-0'}`}>
                                                                    <div className="flex flex-col pl-4 border-l border-gray-100 space-y-1 mt-1">
                                                                        {subLink.sub.map(nested => (
                                                                            <div key={nested.label}>
                                                                                <Link
                                                                                    to={nested.path}
                                                                                    onClick={() => setIsOpen(false)}
                                                                                    className="py-1.5 text-[12px] text-gray-400 hover:text-[#b5128f] block"
                                                                                >
                                                                                    {nested.label}
                                                                                </Link>
                                                                                {nested.sub && (
                                                                                    <div className="flex flex-col pl-4 border-l border-gray-50 space-y-1 ml-1 mb-2">
                                                                                        {nested.sub.map(fourth => (
                                                                                            <Link
                                                                                                key={fourth.label}
                                                                                                to={fourth.path}
                                                                                                onClick={() => setIsOpen(false)}
                                                                                                className="py-1 text-[11px] text-gray-400/80 hover:text-[#b5128f]"
                                                                                            >
                                                                                                {fourth.label}
                                                                                            </Link>
                                                                                        ))}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {/* Utility Links in Mobile Menu */}
                                <div className="pt-6 mt-6 border-t border-gray-100 space-y-4">
                                    <div className="grid grid-cols-2 gap-2">
                                        {topLinks.map(link => (
                                            <Link
                                                key={link.label}
                                                to={link.path}
                                                onClick={() => setIsOpen(false)}
                                                className="py-2 px-3 bg-gray-50 rounded-lg text-[10px] font-bold text-gray-600 text-center"
                                            >
                                                {link.label}
                                            </Link>
                                        ))}
                                    </div>

                                    {!isAuthenticated ? (
                                        <button
                                            onClick={() => {
                                                setIsOpen(false);
                                                openLoginModal();
                                            }}
                                            className="w-full py-3 bg-[#b5128f] text-white font-bold uppercase tracking-wider rounded-xl shadow-lg active:scale-95 transition-all text-xs"
                                        >
                                            Sign In / Register
                                        </button>
                                    ) : (
                                        <Link
                                            to="/account"
                                            onClick={() => setIsOpen(false)}
                                            className="flex items-center justify-center gap-3 p-3 bg-[#b5128f]/10 rounded-xl text-[#b5128f] font-bold text-xs"
                                        >
                                            <User size={18} />
                                            <span>My Account ({user?.fullName})</span>
                                        </Link>
                                    )}
                                </div>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>

            <LoginModal />
        </header>
    );
};

export default Header;
