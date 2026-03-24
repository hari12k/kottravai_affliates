
import { Truck, MapPin, Clock, Calendar, AlertCircle } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';
import { Helmet } from 'react-helmet-async';

const ShippingPolicy = () => {
    return (
        <MainLayout>
            <Helmet>
                <title>Shipping Policy - Kottravai</title>
                <meta name="description" content="Kottravai Shipping Policy - Information on shipping locations, processing times, delivery estimates, and tracking." />
            </Helmet>

            <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8 font-sans">
                <div className="max-w-4xl mx-auto bg-white rounded-[2rem] shadow-xl overflow-hidden border border-gray-100">

                    {/* Header Section */}
                    <div className="bg-[#2D1B4E] text-white p-8 md:p-12 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#b5128f] rounded-full mix-blend-multiply filter blur-3xl opacity-20 -mr-16 -mt-16"></div>
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#b5128f] rounded-full mix-blend-multiply filter blur-3xl opacity-20 -ml-10 -mb-10"></div>

                        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-black uppercase tracking-wider mb-4">Shipping Policy</h1>
                                <p className="text-gray-300 max-w-xl text-lg leading-relaxed">
                                    At Kottravai, every product is handcrafted with care by rural women artisans. We ensure safe and timely delivery while respecting the handmade nature of our products.
                                </p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-lg">
                                <Truck size={48} className="text-[#b5128f]" />
                            </div>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-8 md:p-12 space-y-10 text-gray-700">

                        {/* Shipping Locations */}
                        <div className="flex gap-6 items-start">
                            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0 text-[#b5128f]">
                                <MapPin size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-[#2D1B4E] mb-3">Shipping Locations</h3>
                                <p className="leading-relaxed">
                                    We currently ship across <span className="font-semibold text-[#b5128f]">India</span>.
                                </p>
                            </div>
                        </div>

                        {/* Processing Time */}
                        <div className="flex gap-6 items-start">
                            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0 text-[#b5128f]">
                                <Clock size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-[#2D1B4E] mb-3">Processing Time</h3>
                                <p className="leading-relaxed mb-2">
                                    All orders are processed within <span className="font-semibold">3–7 business days</span>.
                                </p>
                                <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-xl border border-gray-100 italic">
                                    Since our products are handcrafted, certain items may require additional preparation time. Any delays will be communicated via email or WhatsApp.
                                </p>
                            </div>
                        </div>

                        {/* Delivery Time */}
                        <div className="flex gap-6 items-start">
                            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0 text-[#b5128f]">
                                <Calendar size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-[#2D1B4E] mb-3">Delivery Time</h3>
                                <ul className="space-y-3 list-disc list-inside marker:text-[#b5128f]">
                                    <li className="pl-2"><span className="font-semibold">Standard Delivery:</span> 5–10 business days after dispatch</li>
                                    <li className="pl-2">Remote locations may take slightly longer</li>
                                </ul>
                            </div>
                        </div>

                        {/* Shipping Charges */}
                        <div className="bg-[#FAF9F6] p-6 rounded-2xl border border-gray-100">
                            <h3 className="text-lg font-bold text-[#2D1B4E] mb-4">Shipping Charges</h3>
                            <ul className="space-y-2">
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#b5128f]"></div>
                                    Shipping charges, if applicable, will be calculated and displayed at checkout.
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#b5128f]"></div>
                                    Free shipping may be offered during promotional periods.
                                </li>
                            </ul>
                        </div>

                        {/* Additional Info Grid */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="border border-gray-100 p-6 rounded-2xl hover:shadow-md transition-shadow">
                                <h4 className="font-bold text-[#2D1B4E] mb-2 flex items-center gap-2">
                                    <AlertCircle size={18} className="text-[#b5128f]" /> Order Tracking
                                </h4>
                                <p className="text-sm text-gray-600">
                                    Once your order is shipped, tracking details will be shared via email or WhatsApp.
                                </p>
                            </div>

                            <div className="border border-gray-100 p-6 rounded-2xl hover:shadow-md transition-shadow">
                                <h4 className="font-bold text-[#2D1B4E] mb-2 flex items-center gap-2">
                                    <AlertCircle size={18} className="text-red-500" /> Damaged Shipments
                                </h4>
                                <p className="text-sm text-gray-600">
                                    If your order arrives damaged or is lost, please contact us within <span className="font-semibold">48 hours</span>.
                                </p>
                            </div>
                        </div>

                        {/* Contact Footer */}
                        <div className="border-t border-gray-100 pt-8 text-center">
                            <p className="text-gray-500 mb-2">Have questions about your order?</p>
                            <a href="mailto:support@kottravai.in" className="inline-block text-[#b5128f] font-bold text-lg hover:underline decoration-2 underline-offset-4">
                                📩 support@kottravai.in
                            </a>
                        </div>

                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default ShippingPolicy;
