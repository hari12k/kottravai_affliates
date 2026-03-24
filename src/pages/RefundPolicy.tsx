
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';
import { Helmet } from 'react-helmet-async';

const RefundPolicy = () => {
    return (
        <MainLayout>
            <Helmet>
                <title>Refund Policy - Kottravai</title>
                <meta name="description" content="Kottravai Refund Policy - Details on returns, refunds, non-returnable items, and replacement process." />
            </Helmet>

            <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8 font-sans">
                <div className="max-w-4xl mx-auto bg-white rounded-[2rem] shadow-xl overflow-hidden border border-gray-100">

                    {/* Header Section */}
                    <div className="bg-gradient-to-r from-[#2D1B4E] to-[#1a0f2e] text-white p-8 md:p-12 relative">
                        <div className="relative z-10">
                            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-wider mb-4">Refund Policy</h1>
                            <p className="text-gray-300 text-lg max-w-2xl">
                                We value trust and transparency while supporting artisan livelihoods. Learn more about our return and refund process below.
                            </p>
                        </div>
                        <div className="absolute top-1/2 right-10 -translate-y-1/2 bg-white/5 p-4 rounded-full backdrop-blur-sm hidden md:block">
                            <RefreshCw size={64} className="text-[#b5128f] opacity-80" />
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-8 md:p-12 space-y-12 text-gray-700">

                        {/* Returns & Refunds */}
                        <section>
                            <h2 className="text-2xl font-bold text-[#2D1B4E] mb-6 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-[#b5128f] text-white flex items-center justify-center text-sm">1</span>
                                Returns & Refunds
                            </h2>
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
                                <div className="flex gap-4">
                                    <AlertTriangle className="text-blue-500 flex-shrink-0" size={24} />
                                    <div className="space-y-3">
                                        <p className="leading-relaxed text-blue-900">
                                            Due to the handmade and perishable nature of certain products, returns are accepted <span className="font-bold">only for damaged, defective, or incorrect items</span>.
                                        </p>
                                        <div className="inline-block bg-white px-3 py-1 rounded-lg text-sm font-semibold text-blue-600 border border-blue-200">
                                            Requests must be raised within 48 hours of delivery.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Non-Returnable Items */}
                        <section>
                            <h2 className="text-2xl font-bold text-[#2D1B4E] mb-6 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-[#b5128f] text-white flex items-center justify-center text-sm">2</span>
                                Non-Returnable Items
                            </h2>
                            <div className="grid sm:grid-cols-3 gap-4">
                                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 text-center hover:border-red-200 transition-colors group">
                                    <XCircle className="mx-auto text-gray-400 mb-3 group-hover:text-red-500 transition-colors" size={32} />
                                    <h4 className="font-bold text-gray-800 text-sm">Food Products & Consumables</h4>
                                </div>
                                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 text-center hover:border-red-200 transition-colors group">
                                    <XCircle className="mx-auto text-gray-400 mb-3 group-hover:text-red-500 transition-colors" size={32} />
                                    <h4 className="font-bold text-gray-800 text-sm">Customized / Made-to-order</h4>
                                </div>
                                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 text-center hover:border-red-200 transition-colors group">
                                    <XCircle className="mx-auto text-gray-400 mb-3 group-hover:text-red-500 transition-colors" size={32} />
                                    <h4 className="font-bold text-gray-800 text-sm">Used or Altered Products</h4>
                                </div>
                            </div>
                        </section>

                        {/* Refund Process */}
                        <section>
                            <h2 className="text-2xl font-bold text-[#2D1B4E] mb-6 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-[#b5128f] text-white flex items-center justify-center text-sm">3</span>
                                Refund Process
                            </h2>
                            <div className="space-y-4">
                                <div className="flex items-start gap-4 p-4 border border-gray-100 rounded-xl hover:shadow-md transition-shadow">
                                    <CheckCircle className="text-green-500 mt-1" size={20} />
                                    <div>
                                        <h4 className="font-bold text-gray-900">Approval & Timeline</h4>
                                        <p className="text-sm text-gray-600 mt-1">Once approved, refunds will be processed within <span className="font-bold">7–10 business days</span>.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 p-4 border border-gray-100 rounded-xl hover:shadow-md transition-shadow">
                                    <CheckCircle className="text-green-500 mt-1" size={20} />
                                    <div>
                                        <h4 className="font-bold text-gray-900">Original Payment Method</h4>
                                        <p className="text-sm text-gray-600 mt-1">Refunds will be strictly credited back to the original source of payment.</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Replacement */}
                        <div className="bg-[#FAF9F6] p-8 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
                            <div>
                                <h3 className="text-xl font-bold text-[#2D1B4E] mb-2">Replacement Policy</h3>
                                <p className="text-gray-600">Where possible, we may offer a replacement instead of a refund to ensure you get the product you love.</p>
                            </div>
                            <div className="shrink-0 bg-white p-3 rounded-full shadow-sm">
                                <RefreshCw className="text-[#b5128f] animate-spin-slow" size={28} />
                            </div>
                        </div>

                        {/* Footer Contact */}
                        <div className="text-center pt-6 border-t border-gray-100">
                            <a
                                href="mailto:support@kottravai.in"
                                className="inline-flex items-center gap-2 bg-[#2D1B4E] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#b5128f] transition-all transform hover:-translate-y-1 shadow-lg"
                            >
                                Email refund requests <ArrowRight size={18} />
                            </a>
                            <p className="mt-4 text-sm text-gray-500">support@kottravai.in</p>
                        </div>

                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default RefundPolicy;
