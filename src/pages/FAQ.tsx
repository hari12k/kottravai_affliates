import MainLayout from '@/layouts/MainLayout';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqData = [
    {
        category: "Ordering & Payments",
        questions: [
            {
                q: "How do I place an order on Kottravai?",
                a: "Ordering from Kottravai is simple. Browse our handcrafted collections, add your favorite items to the cart, and proceed to checkout. You’ll receive an order confirmation once payment is successful."
            },
            {
                q: "What payment methods do you accept?",
                a: "We accept secure online payments including:\n• UPI\n• Credit & Debit Cards\n• Net Banking\n\nAll transactions are protected with SSL encryption."
            }
        ]
    },
    {
        category: "Shipping & Delivery",
        questions: [
            {
                q: "How long does delivery take?",
                a: "Orders are typically delivered within 5–10 business days, depending on your location. Since our products are handcrafted, some items may require additional preparation time."
            },
            {
                q: "Do you ship across India?",
                a: "Yes, we currently ship across India. For bulk or special orders, feel free to contact us before placing your order."
            }
        ]
    },
    {
        category: "Returns & Refunds",
        questions: [
            {
                q: "What is your return policy?",
                a: "We accept returns only for:\n• Damaged products\n• Incorrect items delivered\n\nRequests must be raised within 48 hours of delivery with supporting images."
            },
            {
                q: "When will I receive my refund?",
                a: "Approved refunds are processed within 7–10 working days to the original payment method."
            }
        ]
    },
    {
        category: "Product Materials & Care",
        questions: [
            {
                q: "What materials are used in Kottravai handicrafts?",
                a: "Our products are crafted using natural and sustainable materials such as:\n• Coconut shells\n• Palm leaves\n• Clay\n• Natural fibers\n\nEach piece is handmade by skilled rural women artisans."
            },
            {
                q: "How do I care for handmade products?",
                a: "• Clean gently with a dry or slightly damp cloth\n• Avoid prolonged exposure to water or direct sunlight\n• Handmade items may have natural variations—this is part of their charm"
            }
        ]
    },
    {
        category: "Artisans & Social Impact",
        questions: [
            {
                q: "Who makes Kottravai products?",
                a: "Kottravai works directly with rural women artisans across Tamil Nadu, helping them earn a sustainable livelihood through traditional crafts."
            },
            {
                q: "How does my purchase make an impact?",
                a: "Every purchase:\n• Supports women empowerment\n• Preserves traditional crafts\n• Encourages eco-friendly living\n\nYour order helps create meaningful social change."
            }
        ]
    },
    {
        category: "Support & Contact",
        questions: [
            {
                q: "How can I contact Kottravai for support?",
                a: "You can reach us via:\n• Email\n• Contact form on the website\n\nOur team will respond within 24–48 hours."
            }
        ]
    }
];

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b border-gray-100 last:border-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between py-6 text-left group transition-all"
                aria-expanded={isOpen}
            >
                <span className={`text-lg transition-colors duration-300 font-medium ${isOpen ? 'text-[#b5128f]' : 'text-[#2D1B4E] group-hover:text-[#b5128f]'}`}>
                    {question}
                </span>
                <span className={`flex-shrink-0 ml-6 w-8 h-8 flex items-center justify-center rounded-full border transition-all duration-300 ${isOpen ? 'bg-[#b5128f] border-[#b5128f] text-white rotate-180' : 'bg-transparent border-gray-200 text-gray-400 group-hover:border-[#b5128f] group-hover:text-[#b5128f]'}`}>
                    <ChevronDown size={14} />
                </span>
            </button>
            <div
                className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isOpen ? 'max-h-96 opacity-100 mb-6' : 'max-h-0 opacity-0'}`}
            >
                <div className="text-gray-500 leading-relaxed text-[15px] font-light max-w-2xl">
                    {answer.split('\n').map((line, i) => (
                        <p key={i} className="mb-2 last:mb-0">
                            {line}
                        </p>
                    ))}
                </div>
            </div>
        </div>
    );
};

const FAQ = () => {
    return (
        <MainLayout>
            <div className="bg-white min-h-screen">
                {/* Hero Section - Minimal */}
                <div className="pt-10 pb-12 px-4 text-center max-w-4xl mx-auto">
                    <span className="text-[#b5128f] text-xs font-bold tracking-[0.2em] uppercase mb-4 block">Help Center</span>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-[#2D1B4E] mb-6 tracking-tight leading-tight">
                        Frequently Asked Questions
                    </h1>
                    <p className="text-gray-500 text-lg font-light max-w-xl mx-auto">
                        Curated answers to your questions about our craftsmanship, sustainability, and services.
                    </p>
                </div>

                <div className="container mx-auto px-4 max-w-5xl pb-24">
                    <div className="grid gap-16">
                        {faqData.map((section, catIdx) => (
                            <div key={catIdx} className="grid md:grid-cols-[1fr_2fr] gap-8 md:gap-16 border-t border-gray-100 pt-12 first:border-0 first:pt-0">
                                {/* Category Title */}
                                <div className="md:sticky md:top-24 h-fit">
                                    <h2 className="text-2xl font-bold text-[#2D1B4E] mb-2">
                                        {section.category}
                                    </h2>
                                    <div className="h-1 w-12 bg-[#b5128f] rounded-full opacity-20"></div>
                                </div>

                                {/* Questions List */}
                                <div>
                                    {section.questions.map((item, qIdx) => (
                                        <FAQItem key={qIdx} question={item.q} answer={item.a} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Minimal CTA */}
                    <div className="mt-32 border border-[#f0f0f0] rounded-2xl p-10 md:p-14 text-center bg-[#fafafa]/50 relative overflow-hidden">
                        <div className="relative z-10">
                            <h2 className="text-2xl md:text-3xl font-bold text-[#2D1B4E] mb-3">Still have questions?</h2>
                            <p className="text-gray-500 font-light mb-8">We're here to help you make the right choice.</p>

                            <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
                                <Link
                                    to="/contact"
                                    className="px-8 py-3 bg-[#2D1B4E] text-white rounded-full text-sm font-medium tracking-wide hover:bg-[#b5128f] transition-colors duration-300 shadow-lg shadow-purple-900/10"
                                >
                                    Contact Support
                                </Link>
                                <Link
                                    to="/shop"
                                    className="px-8 py-3 bg-white text-[#2D1B4E] border border-gray-200 rounded-full text-sm font-medium tracking-wide hover:border-[#b5128f] hover:text-[#b5128f] transition-all duration-300"
                                >
                                    Browse Shop
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default FAQ;
