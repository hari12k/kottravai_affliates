import { useState, useEffect, FormEvent } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import { Send, Loader2, User, Phone, MapPin } from 'lucide-react';
import axios from 'axios';
import analytics from '@/utils/analyticsService';

import { useAuth } from '@/context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const Alliance = () => {
    const { openLoginModal, user, isAuthenticated } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        city: '',
        instagram_link: '',
        facebook_link: '',
        twitter_link: '',
        youtube_link: '',
        selling_experience: '',
        products_promoted: '',
        reason: ''
    });
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    useEffect(() => {
        if (isAuthenticated && user) {
            setFormData(prev => ({
                ...prev,
                name: user.fullName || prev.name,
                email: user.email || prev.email,
                phone: user.mobile || prev.phone
            }));
        }
    }, [isAuthenticated, user]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setStatus('loading');

        try {
            await axios.post(`${API_URL}/affiliates/apply`, {
                ...formData,
                user_id: user?.id
            });
            
            // Sync with Google Sheets (Inventory Catalog / Alliance Sheet)
            analytics.trackEvent('alliance_submission', {
                ...formData,
                user_id: user?.id,
                form_type: 'alliance_application'
            }, 'ALLIANCE_APPLICATIONS');

            setStatus('success');
            setFormData({ 
                name: '', email: '', phone: '', city: '', 
                instagram_link: '', facebook_link: '', twitter_link: '', 
                youtube_link: '', selling_experience: '', products_promoted: '', reason: '' 
            });
            setTimeout(() => setStatus('idle'), 5000);
        } catch (error) {
            console.error('Failed to submit application:', error);
            setStatus('error');
        }
    };

    return (
        <MainLayout>
            <Helmet>
                <title>Be a part of kottravai - Kottravai</title>
                <meta name="description" content="Join the Kottravai Alliance and grow with us." />
            </Helmet>

            <div className="py-20 bg-[#FAF9F6]">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="text-center mb-16">
                        <span className="text-[#8E2A8B] font-black uppercase tracking-[0.3em] text-xs mb-2 block">Grow With Us</span>
                        <h1 className="text-4xl md:text-5xl font-black mb-4 text-[#2D1B4E]">Be a part of kottravai</h1>
                        <p className="text-gray-600 max-w-2xl mx-auto text-lg font-medium text-center">Empowering local creators and businesses. Apply now to join our growing network of artisans and partners.</p>
                        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button 
                                onClick={openLoginModal}
                                className="px-6 py-3 bg-[#8E2A8B] text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-[#2D1B4E] transition-all shadow-lg shadow-[#8E2A8B]/20"
                            >
                                Existing Member? Sign In
                            </button>
                            <Link 
                                to="/affiliate/dashboard"
                                className="px-6 py-3 border-2 border-[#8E2A8B] text-[#8E2A8B] text-[11px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-[#8E2A8B] hover:text-white transition-all shadow-sm"
                            >
                                Already a Partner? Go to Portal
                            </Link>
                        </div>
                    </div>

                    <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-xl border border-gray-100">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid md:grid-cols-2 gap-8">
                                {/* Name */}
                                <div className="space-y-2">
                                    <label htmlFor="name" className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                        <User size={16} className="text-[#8E2A8B]" />
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        required
                                        placeholder="Enter your full name"
                                        className="w-full px-5 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8E2A8B]/20 focus:border-[#8E2A8B] outline-none transition bg-gray-50/50"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                {/* Email */}
                                <div className="space-y-2">
                                    <label htmlFor="email" className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                        <MapPin size={16} className="text-[#8E2A8B]" />
                                        Email Address *
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        required
                                        placeholder="Enter your email"
                                        className="w-full px-5 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8E2A8B]/20 focus:border-[#8E2A8B] outline-none transition bg-gray-50/50"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>

                                {/* Phone */}
                                <div className="space-y-2">
                                    <label htmlFor="phone" className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                        <Phone size={16} className="text-[#8E2A8B]" />
                                        Phone Number *
                                    </label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        required
                                        placeholder="+91 XXXXX XXXXX"
                                        className="w-full px-5 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8E2A8B]/20 focus:border-[#8E2A8B] outline-none transition bg-gray-50/50"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>

                                {/* City */}
                                <div className="space-y-2">
                                    <label htmlFor="city" className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                        <MapPin size={16} className="text-[#8E2A8B]" />
                                        City *
                                    </label>
                                    <input
                                        type="text"
                                        id="city"
                                        required
                                        placeholder="Enter your city"
                                        className="w-full px-5 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8E2A8B]/20 focus:border-[#8E2A8B] outline-none transition bg-gray-50/50"
                                        value={formData.city}
                                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                                    />
                                </div>
                            </div>


                            <div className="space-y-4">
                                <h3 className="text-sm font-black text-[#8E2A8B] uppercase tracking-widest">Social Media</h3>
                                <div className="grid md:grid-cols-2 gap-8">
                                    {/* Instagram */}
                                    <div className="space-y-2">
                                        <label htmlFor="instagram_link" className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                            <img src="/icons/instagram.png" alt="Instagram" className="w-5 h-5 object-contain" />
                                            Instagram Link *
                                        </label>
                                        <input
                                            type="text"
                                            id="instagram_link"
                                            required
                                            placeholder="Instagram profile link"
                                            className="w-full px-5 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E4405F]/20 focus:border-[#E4405F] outline-none transition bg-gray-50/50"
                                            value={formData.instagram_link}
                                            onChange={e => setFormData({ ...formData, instagram_link: e.target.value })}
                                        />
                                    </div>

                                    {/* Facebook */}
                                    <div className="space-y-2">
                                        <label htmlFor="facebook_link" className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                            <img src="/icons/facebook.png" alt="Facebook" className="w-5 h-5 object-contain" />
                                            Facebook Link *
                                        </label>
                                        <input
                                            type="text"
                                            id="facebook_link"
                                            required
                                            placeholder="Facebook profile link"
                                            className="w-full px-5 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1877F2]/20 focus:border-[#1877F2] outline-none transition bg-gray-50/50"
                                            value={formData.facebook_link}
                                            onChange={e => setFormData({ ...formData, facebook_link: e.target.value })}
                                        />
                                    </div>

                                    {/* Twitter */}
                                    <div className="space-y-2">
                                        <label htmlFor="twitter_link" className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                            <img src="/icons/x.png" alt="X" className="w-5 h-5 object-contain" />
                                            Twitter (X) Link
                                        </label>
                                        <input
                                            type="text"
                                            id="twitter_link"
                                            placeholder="X profile link"
                                            className="w-full px-5 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1DA1F2]/20 focus:border-[#1DA1F2] outline-none transition bg-gray-50/50"
                                            value={formData.twitter_link}
                                            onChange={e => setFormData({ ...formData, twitter_link: e.target.value })}
                                        />
                                    </div>

                                    {/* Youtube */}
                                    <div className="space-y-2">
                                        <label htmlFor="youtube_link" className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                            <img src="/icons/youtube.png" alt="Youtube" className="w-5 h-5 object-contain" />
                                            Youtube Link
                                        </label>
                                        <input
                                            type="text"
                                            id="youtube_link"
                                            placeholder="Youtube channel link"
                                            className="w-full px-5 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF0000]/20 focus:border-[#FF0000] outline-none transition bg-gray-50/50"
                                            value={formData.youtube_link}
                                            onChange={e => setFormData({ ...formData, youtube_link: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Additional Questions */}
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-gray-700">Selling Experience</label>
                                    <textarea
                                        rows={3}
                                        className="w-full px-5 py-3 border border-gray-200 rounded-xl outline-none bg-gray-50/50 focus:ring-2 focus:ring-[#8E2A8B]/10"
                                        value={formData.selling_experience}
                                        onChange={e => setFormData({...formData, selling_experience: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-gray-700">Products you'd like to promote</label>
                                    <textarea
                                        rows={2}
                                        className="w-full px-5 py-3 border border-gray-200 rounded-xl outline-none bg-gray-50/50 focus:ring-2 focus:ring-[#8E2A8B]/10"
                                        value={formData.products_promoted}
                                        onChange={e => setFormData({...formData, products_promoted: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-gray-700">Why should we choose you? *</label>
                                    <textarea
                                        required
                                        rows={3}
                                        className="w-full px-5 py-3 border border-gray-200 rounded-xl outline-none bg-gray-50/50 focus:ring-2 focus:ring-[#8E2A8B]/10"
                                        value={formData.reason}
                                        onChange={e => setFormData({...formData, reason: e.target.value})}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className="w-full bg-[#1A1A1A] text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-[#8E2A8B] shadow-xl hover:shadow-[#8E2A8B]/20 transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-1 active:scale-[0.98]"
                            >
                                {status === 'loading' ? (
                                    <>
                                        <Loader2 size={20} className="mr-3 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Send size={20} className="mr-3" />
                                        Submit Application
                                    </>
                                )}
                            </button>

                            {/* Status Messages */}
                            {status === 'success' && (
                                <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-2xl text-center text-sm font-bold animate-fade-in">
                                    ✨ Application submitted successfully! We'll reach out to you within 24-48 hours.
                                </div>
                            )}
                            {status === 'error' && (
                                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-center text-sm font-bold">
                                    Unable to process your request. Please check your connection and try again.
                                </div>
                            )}
                        </form>
                    </div>

                    <div className="mt-12 text-center text-gray-400 text-sm">
                        <p>By submitting, you agree to Kottravai's partner terms and privacy conditions.</p>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default Alliance;
