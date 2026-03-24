import { useState, FormEvent } from 'react';
import { Helmet } from 'react-helmet-async';
import MainLayout from '@/layouts/MainLayout';
import { Send, Loader2, User, Phone, MapPin } from 'lucide-react';
import axios from 'axios';
import analytics from '@/utils/analyticsService';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const Alliance = () => {
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: '',
        instaId: '',
        facebookId: '',
        linkedinId: '',
        twitterId: ''
    });
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setStatus('loading');

        try {
            await axios.post(`${API_URL}/alliance`, formData);
            
            // Sync with Google Sheets (Inventory Catalog / Alliance Sheet)
            analytics.trackEvent('alliance_submission', {
                ...formData,
                form_type: 'alliance_application'
            }, 'ALLIANCE_APPLICATIONS');

            setStatus('success');
            setFormData({ name: '', address: '', phone: '', instaId: '', facebookId: '', linkedinId: '', twitterId: '' });
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
                        <p className="text-gray-600 max-w-2xl mx-auto text-lg font-medium">Empowering local creators and businesses. Apply now to join our growing network of artisans and partners.</p>
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
                            </div>

                            {/* Address */}
                            <div className="space-y-2">
                                <label htmlFor="address" className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                    <MapPin size={16} className="text-[#8E2A8B]" />
                                    Address *
                                </label>
                                <textarea
                                    id="address"
                                    required
                                    rows={3}
                                    placeholder="Enter your full business or residence address"
                                    className="w-full px-5 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8E2A8B]/20 focus:border-[#8E2A8B] outline-none transition bg-gray-50/50"
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>


                            <div className="space-y-4">
                                <h3 className="text-sm font-black text-[#8E2A8B] uppercase tracking-widest">Social Media</h3>
                                <div className="grid md:grid-cols-2 gap-8">
                                    {/* Instagram */}
                                    <div className="space-y-2">
                                        <label htmlFor="instaId" className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                            <img src="/icons/instagram.png" alt="Instagram" className="w-5 h-5 object-contain" />
                                            Instagram ID *
                                        </label>
                                        <input
                                            type="text"
                                            id="instaId"
                                            required
                                            placeholder="@yourusername"
                                            className="w-full px-5 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E4405F]/20 focus:border-[#E4405F] outline-none transition bg-gray-50/50"
                                            value={formData.instaId}
                                            onChange={e => setFormData({ ...formData, instaId: e.target.value })}
                                        />
                                    </div>

                                    {/* Facebook */}
                                    <div className="space-y-2">
                                        <label htmlFor="facebookId" className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                            <img src="/icons/facebook.png" alt="Facebook" className="w-5 h-5 object-contain" />
                                            Facebook ID / Link *
                                        </label>
                                        <input
                                            type="text"
                                            id="facebookId"
                                            required
                                            placeholder="Facebook profile link"
                                            className="w-full px-5 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1877F2]/20 focus:border-[#1877F2] outline-none transition bg-gray-50/50"
                                            value={formData.facebookId}
                                            onChange={e => setFormData({ ...formData, facebookId: e.target.value })}
                                        />
                                    </div>

                                    {/* LinkedIn */}
                                    <div className="space-y-2">
                                        <label htmlFor="linkedinId" className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                            <img src="/icons/linkedin.png" alt="LinkedIn" className="w-5 h-5 object-contain" />
                                            LinkedIn Profile
                                        </label>
                                        <input
                                            type="text"
                                            id="linkedinId"
                                            placeholder="LinkedIn profile link"
                                            className="w-full px-5 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0A66C2]/20 focus:border-[#0A66C2] outline-none transition bg-gray-50/50"
                                            value={formData.linkedinId}
                                            onChange={e => setFormData({ ...formData, linkedinId: e.target.value })}
                                        />
                                    </div>

                                    {/* Twitter */}
                                    <div className="space-y-2">
                                        <label htmlFor="twitterId" className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                            <img src="/icons/x.png" alt="X" className="w-5 h-5 object-contain" />
                                            Twitter (X) ID
                                        </label>
                                        <input
                                            type="text"
                                            id="twitterId"
                                            placeholder="@yourusername"
                                            className="w-full px-5 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1DA1F2]/20 focus:border-[#1DA1F2] outline-none transition bg-gray-50/50"
                                            value={formData.twitterId}
                                            onChange={e => setFormData({ ...formData, twitterId: e.target.value })}
                                        />
                                    </div>
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
