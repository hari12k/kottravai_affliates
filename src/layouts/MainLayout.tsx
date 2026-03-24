import { ReactNode } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ChatWidget from '@/components/ChatWidget';
import { useLocation, NavLink } from 'react-router-dom';
import { Home as HomeIcon, ShoppingBag, ShoppingCart, User } from 'lucide-react';
import { useCart } from '@/context/CartContext';


interface MainLayoutProps {
    children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
    const location = useLocation();
    const { cart } = useCart();
    const isHome = location.pathname === '/';
    const isB2B = location.pathname === '/b2b';

    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            {/* Remove padding for Home and B2B to allow full-width banners */}
            <main className={`flex-grow ${isHome || isB2B ? '' : 'pt-4'}`}>
                {children}
            </main>
            <Footer />
            <ChatWidget />


            {/* Premium Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-100 px-6 py-3 z-[100] flex items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                <NavLink
                    to="/"
                    className={({ isActive }) => `flex flex-col items-center gap-1 transition-all ${isActive ? 'text-[#b5128f]' : 'text-gray-400'}`}
                >
                    <HomeIcon size={20} />
                    <span className="text-[10px] font-black uppercase tracking-tighter">Home</span>
                </NavLink>
                <NavLink
                    to="/shop"
                    className={({ isActive }) => `flex flex-col items-center gap-1 transition-all ${isActive ? 'text-[#b5128f]' : 'text-gray-400'}`}
                >
                    <ShoppingBag size={20} />
                    <span className="text-[10px] font-black uppercase tracking-tighter">Shop</span>
                </NavLink>
                <NavLink
                    to="/cart"
                    className={({ isActive }) => `flex flex-col items-center gap-1 transition-all ${isActive ? 'text-[#b5128f]' : 'text-gray-400'} relative`}
                >
                    <ShoppingCart size={20} />
                    {cart.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center animate-pulse">
                            {cart.length}
                        </span>
                    )}
                    <span className="text-[10px] font-black uppercase tracking-tighter">Cart</span>
                </NavLink>
                <NavLink
                    to="/account"
                    className={({ isActive }) => `flex flex-col items-center gap-1 transition-all ${isActive ? 'text-[#b5128f]' : 'text-gray-400'}`}
                >
                    <User size={20} />
                    <span className="text-[10px] font-black uppercase tracking-tighter">Account</span>
                </NavLink>
            </nav>
        </div>
    );
};

export default MainLayout;
