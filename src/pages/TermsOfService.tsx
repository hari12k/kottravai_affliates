
import { FileText, ShieldCheck, AlertCircle, Scale, Copyright } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';
import { Helmet } from 'react-helmet-async';

const TermsOfService = () => {
    return (
        <MainLayout>
            <Helmet>
                <title>Terms of Service - Kottravai</title>
                <meta name="description" content="Kottravai Terms of Service - Guidelines regarding product usage, pricing, cancellations, and liability." />
            </Helmet>

            <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8 font-sans">
                <div className="max-w-4xl mx-auto bg-white rounded-[2rem] shadow-xl overflow-hidden border border-gray-100">

                    <div className="bg-[#2D1B4E] p-10 md:p-14 text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                        <div className="relative z-10">
                            <FileText size={48} className="mx-auto text-[#b5128f] mb-6" />
                            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-widest text-white mb-4">Terms of Service</h1>
                            <p className="text-gray-400 text-sm tracking-widest uppercase">Last Updated: October 2025</p>
                        </div>
                    </div>

                    <div className="p-8 md:p-14 space-y-10 text-gray-700 leading-relaxed">

                        <p className="text-lg font-medium text-center max-w-2xl mx-auto text-gray-800">
                            By accessing or purchasing from Kottravai, you agree to the following terms and conditions.
                        </p>

                        <div className="grid md:grid-cols-2 gap-8">

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-[#2D1B4E]">
                                    <ShieldCheck className="text-[#b5128f]" />
                                    <h3 className="font-bold text-lg">Handcrafted Nature</h3>
                                </div>
                                <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    All products are handcrafted; minor variations in color, texture, or finish are natural and not defects. This is the hallmark of artisanal work.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-[#2D1B4E]">
                                    <Scale className="text-[#b5128f]" />
                                    <h3 className="font-bold text-lg">Prices & Availability</h3>
                                </div>
                                <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    Prices and product availability are subject to change without notice. We strive for accuracy but errors may occur.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-[#2D1B4E]">
                                    <AlertCircle className="text-[#b5128f]" />
                                    <h3 className="font-bold text-lg">Order Cancellation</h3>
                                </div>
                                <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    Kottravai reserves the right to cancel orders due to stock issues, pricing errors, or unforeseen circumstances.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-[#2D1B4E]">
                                    <Copyright className="text-[#b5128f]" />
                                    <h3 className="font-bold text-lg">Intellectual Property</h3>
                                </div>
                                <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    You agree not to misuse, reproduce, or exploit any content or products from our platform without written permission.
                                </p>
                            </div>

                        </div>

                        <div className="border-t border-gray-100 pt-8 mt-8">
                            <h3 className="font-bold text-lg text-[#2D1B4E] mb-2">Limitation of Liability</h3>
                            <p className="text-gray-600 text-sm mb-6">
                                Kottravai shall not be liable for indirect or incidental damages arising from product usage to the fullest extent permitted by law.
                            </p>

                            <div className="bg-[#FAF9F6] p-4 rounded-lg text-center text-sm font-semibold text-[#8E2A8B]">
                                These terms are governed by the laws of India.
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default TermsOfService;
