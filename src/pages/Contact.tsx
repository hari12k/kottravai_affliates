import { useState, FormEvent } from 'react';
import { Helmet } from 'react-helmet-async';
import MainLayout from '@/layouts/MainLayout';
import { Mail, Phone, MapPin, Send, Loader2 } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        message: ''
    });
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setStatus('loading');

        try {
            await axios.post(`${API_URL}/contact`, {
                name: formData.name,
                email: formData.email,
                phone: formData.phone, // Passing phone alongside message content might be needed in template if used
                subject: `Contact from ${formData.name}`,
                message: `${formData.message}\n\nPhone: ${formData.phone}` // Appending phone to message as template didn't explicitly have a phone field separate from contact details logic if separate
            });
            setStatus('success');
            setFormData({ name: '', email: '', phone: '', message: '' });
            setTimeout(() => setStatus('idle'), 5000);
        } catch (error) {
            console.error('Failed to send message:', error);
            setStatus('error');
        }
    };

    return (
        <MainLayout>
            <Helmet>
                <title>Contact Us - Kottravai</title>
                <meta name="description" content="Get in touch with us." />
            </Helmet>

            <div className="py-20 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h1 className="text-4xl font-black mb-4 text-[#2D1B4E]">Get in Touch</h1>
                        <p className="text-gray-600">Have a question or want to work together? Fill out the form below and we'll get back to you shortly.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
                        {/* Contact Info */}
                        <div className="space-y-8">
                            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                                <h3 className="text-xl font-bold mb-6 text-[#2D1B4E]">Contact Information</h3>
                                <div className="space-y-6">
                                    <div className="flex items-start">
                                        <div className="w-10 h-10 bg-[#fdf4fc] rounded-full flex items-center justify-center text-[#8E2A8B] mt-1">
                                            <Mail size={20} />
                                        </div>
                                        <div className="ml-4">
                                            <h4 className="font-medium text-gray-900">Email</h4>
                                            <p className="text-gray-600">contact@kottravai.in</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <div className="w-10 h-10 bg-[#fdf4fc] rounded-full flex items-center justify-center text-[#8E2A8B] mt-1">
                                            <Phone size={20} />
                                        </div>
                                        <div className="ml-4">
                                            <h4 className="font-medium text-gray-900">Phone</h4>
                                            <p className="text-gray-600">+91 97870 30811</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <div className="w-10 h-10 bg-[#fdf4fc] rounded-full flex items-center justify-center text-[#8E2A8B] mt-1">
                                            <MapPin size={20} />
                                        </div>
                                        <div className="ml-4">
                                            <h4 className="font-medium text-gray-900">Office</h4>
                                            <p className="text-gray-600">Vazhai Incubator, S Veerachamy Chettiar college, Puliyangudi - 627855</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-bold text-gray-700 mb-1">Full Name *</label>
                                    <input
                                        type="text"
                                        id="name"
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8E2A8B] focus:border-transparent outline-none transition"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-1">Email Address *</label>
                                    <input
                                        type="email"
                                        id="email"
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8E2A8B] focus:border-transparent outline-none transition"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="phone" className="block text-sm font-bold text-gray-700 mb-1">Phone Number (Optional)</label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8E2A8B] focus:border-transparent outline-none transition"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="message" className="block text-sm font-bold text-gray-700 mb-1">Message *</label>
                                    <textarea
                                        id="message"
                                        required
                                        rows={4}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8E2A8B] focus:border-transparent outline-none transition"
                                        value={formData.message}
                                        onChange={e => setFormData({ ...formData, message: e.target.value })}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={status === 'loading'}
                                    className="w-full bg-[#2D1B4E] text-white py-3 rounded-lg font-bold hover:bg-[#8E2A8B] transition flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {status === 'loading' ? (
                                        <>
                                            <Loader2 size={18} className="mr-2 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send size={18} className="mr-2" />
                                            Send Message
                                        </>
                                    )}
                                </button>

                                {status === 'success' && (
                                    <div className="bg-green-50 text-green-700 p-3 rounded-lg text-center text-sm font-medium">
                                        Message sent successfully! We'll get back to you soon.
                                    </div>
                                )}
                                {status === 'error' && (
                                    <div className="bg-red-50 text-red-700 p-3 rounded-lg text-center text-sm font-medium">
                                        Failed to send message. Please try again later.
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default Contact;
