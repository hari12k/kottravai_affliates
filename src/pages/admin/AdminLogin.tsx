import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, AlertCircle } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';

const AdminLogin = () => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // This is a simple separation as requested. 
        // In a real production app, this would be a backend-verified JWT for an admin role.
        const adminPass = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';

        if (password === adminPass) {
            sessionStorage.setItem('kottravai_admin_session', 'true');
            sessionStorage.setItem('kottravai_admin_token', password);
            navigate('/admin');
        } else {
            setError('Invalid Admin Password');
        }
    };

    return (
        <MainLayout>
            <div className="min-h-[70vh] flex items-center justify-center bg-gray-50 px-4">
                <div className="max-w-md w-full">
                    <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-10">
                        <div className="text-center mb-10 group cursor-pointer">
                            <img src="/admin-logo.png" alt="Kottravai" className="h-16 h-auto mx-auto mb-8 object-contain transition-all duration-500 group-hover:scale-110 group-hover:brightness-0 group-hover:invert" />
                            <h1 className="text-3xl font-black text-[#2D1B4E] uppercase tracking-wider">Admin Access</h1>
                            <p className="text-gray-500 mt-2 font-medium">Restricted Management Area</p>
                        </div>

                        {error && (
                            <div className="mb-6 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3 animate-shake">
                                <AlertCircle size={20} />
                                <span className="text-sm font-bold">{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-xs font-black text-[#2D1B4E] uppercase tracking-widest mb-2 ml-1">
                                    Secure Password
                                </label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        required
                                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-[#8E2A8B]/20 focus:border-[#8E2A8B] outline-none transition-all font-medium pr-12"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                                        <Lock size={20} />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-[#2D1B4E] hover:bg-[#8E2A8B] text-white font-black uppercase tracking-[0.2em] py-5 rounded-2xl transition-all transform active:scale-95 shadow-xl shadow-purple-900/20"
                            >
                                Authenticate
                            </button>
                        </form>

                        <div className="mt-8 pt-8 border-t border-gray-100 text-center">
                            <button
                                onClick={() => navigate('/')}
                                className="text-sm font-bold text-gray-400 hover:text-[#2D1B4E] transition-colors"
                            >
                                Back to Public Site
                            </button>
                        </div>
                    </div>

                    <p className="text-center mt-8 text-gray-400 text-xs font-medium tracking-widest uppercase">
                        &copy; {new Date().getFullYear()} Kottravai Secure Terminal
                    </p>
                </div>
            </div>
        </MainLayout>
    );
};

export default AdminLogin;
