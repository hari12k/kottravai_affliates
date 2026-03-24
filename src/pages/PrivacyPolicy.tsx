
import { Shield, Lock, Eye, Database, Cookie, Mail } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';
import { Helmet } from 'react-helmet-async';

const PrivacyPolicy = () => {
    return (
        <MainLayout>
            <Helmet>
                <title>Privacy Policy - Kottravai</title>
                <meta name="description" content="Kottravai Privacy Policy - How we collect, use, and protect your personal data." />
            </Helmet>

            <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8 font-sans">
                <div className="max-w-4xl mx-auto">

                    <div className="text-center mb-12">
                        <div className="w-20 h-20 bg-white rounded-3xl mx-auto flex items-center justify-center shadow-lg transform rotate-3 mb-6">
                            <Shield size={40} className="text-[#b5128f]" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-[#2D1B4E] mb-4">Privacy Policy</h1>
                        <p className="text-gray-500 font-medium">Your privacy matters to us.</p>
                    </div>

                    <div className="space-y-6">

                        {/* Information We Collect */}
                        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-md transition-all">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-purple-50 rounded-2xl text-[#b5128f]">
                                    <Database size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-[#2D1B4E] mb-4">Information We Collect</h3>
                                    <ul className="space-y-3 text-gray-600">
                                        <li className="flex items-center gap-3">
                                            <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                                            Name, contact details, shipping address
                                        </li>
                                        <li className="flex items-center gap-3">
                                            <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                                            Payment and transaction details
                                        </li>
                                        <li className="flex items-center gap-3">
                                            <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                                            Website usage data (cookies & analytics)
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* How We Use Your Information */}
                        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-md transition-all">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                                    <Eye size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-[#2D1B4E] mb-4">How We Use Your Information</h3>
                                    <ul className="grid sm:grid-cols-2 gap-4 text-gray-600">
                                        <li className="bg-gray-50 px-4 py-2 rounded-lg text-sm border border-gray-100">
                                            To process and deliver orders
                                        </li>
                                        <li className="bg-gray-50 px-4 py-2 rounded-lg text-sm border border-gray-100">
                                            To communicate order updates
                                        </li>
                                        <li className="bg-gray-50 px-4 py-2 rounded-lg text-sm border border-gray-100 sm:col-span-2">
                                            To improve our services and user experience
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Data Protection */}
                        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-md transition-all">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-green-50 rounded-2xl text-green-600">
                                    <Lock size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-[#2D1B4E] mb-4">Data Protection</h3>
                                    <div className="space-y-4 text-gray-600">
                                        <p className="leading-relaxed">
                                            We do not sell or share your personal information with third parties except for delivery and payment processing.
                                        </p>
                                        <div className="flex items-center gap-2 text-green-700 font-medium text-sm">
                                            <Shield size={16} />
                                            Secure payment gateways are used for all transactions.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Cookies & Consent */}
                        <div className="bg-gradient-to-br from-[#2D1B4E] to-[#120a21] p-8 rounded-[2rem] text-white shadow-xl">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-white/10 rounded-2xl text-[#b5128f]">
                                    <Cookie size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold mb-2">Cookies & Consent</h3>
                                    <p className="text-gray-300 text-sm leading-relaxed mb-4">
                                        We use cookies to enhance website functionality and performance. By using our website, you consent to our privacy practices.
                                    </p>
                                    <a href="mailto:support@kottravai.in" className="inline-flex items-center gap-2 text-[#b5128f] font-bold hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-lg">
                                        <Mail size={16} /> Contact for privacy concerns
                                    </a>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default PrivacyPolicy;
