import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import MainLayout from '@/layouts/MainLayout';
import { BadgeCheck, Heart, Leaf, Users, Gift, Truck, FileText, Send, Building2, UserCheck, Briefcase, ChevronLeft, ChevronRight, Palmtree, Sparkles, Monitor, Star, Tag } from 'lucide-react';
import { useReviews } from '@/context/ReviewContext';

const B2B = () => {
    const { getReviewsByPage } = useReviews();
    const testimonials = getReviewsByPage('b2b');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        company: '',
        location: '',
        products: '',
        quantity: '',
        notes: ''
    });

    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setStatus('idle');
        setMessage('');

        try {
            const response = await fetch('/api/b2b-inquiry', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (response.ok) {
                setStatus('success');
                setMessage('Thank you! We received your inquiry and will contact you soon.');
                setFormData({
                    name: '', email: '', phone: '', company: '',
                    location: '', products: '', quantity: '', notes: ''
                });
            } else {
                setStatus('error');
                setMessage(result.message || 'Something went wrong. Please try again.');
            }
        } catch (error) {
            console.error('Submission Error:', error);
            setStatus('error');
            setMessage('Failed to submit form. Please check your connection.');
        }
    };

    const scrollToForm = () => {
        document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <MainLayout>
            <Helmet>
                <title>B2B & Corporate Gifting - Kottravai</title>
                <meta name="description" content="Sustainable, ethical, and handcrafted corporate gifts that empower rural women artisans." />
            </Helmet>

            {/* Hero Section */}
            <div className="w-full">
                <img
                    src="/b2b_banner.jpg"
                    alt="Purposeful Corporate Gifting that creates real impact!"
                    className="w-full h-auto object-cover"
                />
            </div>

            {/* Why Gift with Kottravai? */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-4xl font-black text-[#2D1B4E] mb-4">Why Gift with Kottravai?</h2>
                        <div className="w-20 h-1 bg-[#8E2A8B] mx-auto rounded-full"></div>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { icon: Users, title: "Empowers Rural Women", desc: "Every product is crafted by skilled women artisans, ensuring fair wages and sustained livelihoods." },
                            { icon: BadgeCheck, title: "Authentic Craftsmanship", desc: "Rooted in ancient design and modern aesthetics — each piece tells a story of culture and resilience." },
                            { icon: Leaf, title: "Sustainable & Ethical", desc: "Thoughtful materials, earth-friendly packaging and zero compromise on values at every step." },
                            { icon: Heart, title: "Relationship-First", desc: "Hampers curated to express appreciation that is heartfelt, not transactional." }
                        ].map((item, idx) => (
                            <div key={idx} className="p-8 bg-gray-50 rounded-2xl text-center group hover:bg-[#F8F0FF] transition-colors duration-300">
                                <div className="w-16 h-16 mx-auto bg-white rounded-full flex items-center justify-center text-[#8E2A8B] mb-6 shadow-sm group-hover:scale-110 transition-transform">
                                    <item.icon size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-[#2D1B4E] mb-3">{item.title}</h3>
                                <p className="text-gray-600 leading-relaxed text-sm">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Ripple Effects Impact */}
            <section className="py-20 bg-[#F8F9FA]">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-4xl font-black text-[#2D1B4E] mb-4">Your Gift Creates Ripple Effects</h2>
                        <p className="text-gray-600">When you choose Kottravai, you start a cycle of positive change.</p>
                    </div>

                    <div className="grid md:grid-cols-4 gap-6">
                        {[
                            { title: "Financial Independence", desc: "A woman chooses to earn with dignity and confidence." },
                            { title: "Family Stability", desc: "Purchase strengthens households and uplifts entire communities." },
                            { title: "Education", desc: "Earnings help families educate children and secure dreams." },
                            { title: "Cultural Preservation", desc: "Traditional crafts continue to thrive for future generations." }
                        ].map((item, idx) => (
                            <div key={idx} className="bg-white p-6 rounded-xl border border-gray-100 hover:border-[#8E2A8B] transition-all">
                                <h3 className="text-lg font-bold text-[#8E2A8B] mb-2">{item.title}</h3>
                                <p className="text-gray-600 text-sm">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Best Sellers Section */}
            <section className="pt-24 pb-10 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-black text-[#1a1a1a] uppercase tracking-[0.2em] mb-3">Best Sellers</h2>
                        <div className="w-12 h-1 bg-[#8E2A8B] mx-auto opacity-30"></div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-[1300px] mx-auto">
                        {/* Large Left Card - Coconut Shell */}
                        <div className="relative group overflow-hidden rounded-[2rem] aspect-square lg:aspect-auto lg:h-[700px] shadow-2xl hover:shadow-[#8E2A8B]/10 transition-all duration-500">
                            <img
                                src="cs.jpg"
                                alt="Coconut Shell Products"
                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-10 md:p-14">
                                <h3 className="text-white text-3xl md:text-4xl font-bold mb-8">Coconut Shell Products</h3>
                                <div className="flex flex-wrap gap-4">
                                    <Link to="/category/coco-crafts" className="bg-[#E5E7EB] text-black px-8 py-3.5 text-xs font-black uppercase tracking-[0.15em] hover:bg-white transition-all transform active:scale-95 flex items-center gap-2 rounded-lg">
                                        Shop Now <span className="text-base">→</span>
                                    </Link>
                                    <button
                                        onClick={scrollToForm}
                                        className="border-2 border-white/40 text-white px-8 py-3.5 text-xs font-black uppercase tracking-[0.15em] hover:bg-white hover:text-[#8E2A8B] hover:border-white transition-all transform active:scale-95 flex items-center gap-2 rounded-lg backdrop-blur-sm">
                                        Enquiry <span className="text-base">→</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right Column Grid */}
                        <div className="grid grid-rows-2 gap-6">
                            {/* Top Card - Terracotta */}
                            <div className="relative group overflow-hidden rounded-[2rem] h-[340px] shadow-xl hover:shadow-[#8E2A8B]/10 transition-all duration-500">
                                <img
                                    src="teer.jpg"
                                    alt="Terracotta Jewellery"
                                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8 md:p-10">
                                    <h3 className="text-white text-2xl font-bold mb-6">Terracotta</h3>
                                    <div className="flex flex-wrap gap-3">
                                        <Link to="/category/terracotta-ornaments" className="bg-[#E5E7EB] text-black px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.15em] hover:bg-white transition-all transform active:scale-95 flex items-center gap-2 rounded-lg">
                                            Shop Now <span>→</span>
                                        </Link>
                                        <button
                                            onClick={scrollToForm}
                                            className="border-2 border-white/40 text-white px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.15em] hover:bg-white hover:text-[#8E2A8B] hover:border-white transition-all transform active:scale-95 flex items-center gap-2 rounded-lg backdrop-blur-sm">
                                            Enquiry <span>→</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {/* Bottom Left - Crochet */}
                                <div className="relative group overflow-hidden rounded-[2rem] h-[334px] shadow-xl hover:shadow-[#8E2A8B]/10 transition-all duration-500">
                                    <img
                                        src="unnamed.jpg"
                                        alt="Heritage Mixes"
                                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 md:p-8">
                                        <h3 className="text-white text-xl font-bold mb-6">Heritage Mixes</h3>
                                        <div className="flex flex-wrap gap-2">
                                            <Link to="/category/heritage-mixes" className="bg-[#E5E7EB] text-black px-4 py-2 text-[10px] font-black uppercase tracking-[0.1em] hover:bg-white transition-all transform active:scale-95 flex items-center justify-center gap-1 flex-1 sm:flex-initial rounded-md">
                                                Shop Now <span>→</span>
                                            </Link>
                                            <button
                                                onClick={scrollToForm}
                                                className="border border-white/40 text-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.1em] hover:bg-white hover:text-[#8E2A8B] hover:border-white transition-all transform active:scale-95 flex items-center justify-center gap-1 flex-1 sm:flex-initial rounded-md backdrop-blur-sm">
                                                Enquiry <span>→</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Right - Healthy Mixes */}
                                <div className="relative group overflow-hidden rounded-[2rem] h-[334px] shadow-xl hover:shadow-[#8E2A8B]/10 transition-all duration-500">
                                    <img
                                        src="hm.jpg"
                                        alt="Healthy Mixes"
                                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 md:p-8">
                                        <h3 className="text-white text-xl font-bold mb-6">Healthy Mixes</h3>
                                        <div className="flex flex-wrap gap-2">
                                            <Link to="/category/instant-nourish" className="bg-[#E5E7EB] text-black px-4 py-2 text-[10px] font-black uppercase tracking-[0.1em] hover:bg-white transition-all transform active:scale-95 flex items-center justify-center gap-1 flex-1 sm:flex-initial rounded-md">
                                                Shop Now <span>→</span>
                                            </Link>
                                            <button
                                                onClick={scrollToForm}
                                                className="border border-white/40 text-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.1em] hover:bg-white hover:text-[#8E2A8B] hover:border-white transition-all transform active:scale-95 flex items-center justify-center gap-1 flex-1 sm:flex-initial rounded-md backdrop-blur-sm">
                                                Enquiry <span>→</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* "How We Work" Flow Section */}
            <section className="pt-10 pb-10 bg-white overflow-hidden relative font-sans">
                <div className="container mx-auto px-4 max-w-[1400px]">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-12 max-w-4xl mx-auto md:mx-0 md:max-w-none md:px-8">
                        <div className="text-center md:text-left mx-auto md:mx-0 mb-8 md:mb-0">
                            <h2 className="text-4xl md:text-5xl font-bold text-[#1a1a1a] mb-3 tracking-tight">How We Work with Corporates</h2>
                            <p className="text-lg text-gray-500 font-light">From brief to delivery, we make your gifting seamless and impactful.</p>
                        </div>

                        {/* Nav Buttons */}
                        <div className="flex gap-4 hidden md:flex">
                            <button
                                onClick={() => document.getElementById('workFlowScroll')?.scrollBy({ left: -380, behavior: 'smooth' })}
                                className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center hover:bg-[#8E2A8B] hover:border-[#8E2A8B] hover:text-white transition-all shadow-sm group"
                                aria-label="Previous Step"
                            >
                                <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                            </button>
                            <button
                                onClick={() => document.getElementById('workFlowScroll')?.scrollBy({ left: 380, behavior: 'smooth' })}
                                className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center hover:bg-[#8E2A8B] hover:border-[#8E2A8B] hover:text-white transition-all shadow-sm group"
                                aria-label="Next Step"
                            >
                                <ChevronRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
                            </button>
                        </div>
                    </div>

                    {/* Scroll Container */}
                    <div
                        id="workFlowScroll"
                        className="overflow-x-auto pb-10 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide scroll-smooth"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        <div className="flex gap-8 w-max px-4 md:px-8">
                            {[
                                {
                                    step: "Step 1",
                                    title: "Connect with Our Team",
                                    desc: "Share your requirements, occasion, theme, quantity and budget so we can suggest the best options.",
                                    img: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=1000&auto=format&fit=crop"
                                },
                                {
                                    step: "Step 2",
                                    title: "Curate Your Hamper",
                                    desc: "Choose from our catalog or build a fully custom hamper that matches your brand and event theme.",
                                    img: "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?q=80&w=1000&auto=format&fit=crop"
                                },
                                {
                                    step: "Step 3",
                                    title: "Branding & Personalization",
                                    desc: "Add your logo, event name, custom notes, and personalized messages to every gift.",
                                    img: "https://images.unsplash.com/photo-1607344645866-009c320b63e0?q=80&w=1000&auto=format&fit=crop"
                                },
                                {
                                    step: "Step 4",
                                    title: "Effortless Delivery",
                                    desc: "We handle packing and logistics — ship in bulk to your office or direct-to-home for each recipient.",
                                    img: "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?q=80&w=1000&auto=format&fit=crop"
                                },
                                {
                                    step: "Step 5",
                                    title: "Impact Reporting",
                                    desc: "Receive a clear report on the women and artisan communities your gifting order supported.",
                                    img: "https://images.unsplash.com/photo-1456324504439-367cee3b3c32?q=80&w=1000&auto=format&fit=crop"
                                }
                            ].map((item, idx) => (
                                <article key={idx} className="w-[300px] md:w-[350px] bg-white rounded-2xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.03)] border border-gray-50 flex-shrink-0 group hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(142,42,139,0.08)] transition-all duration-300">
                                    <div className="h-[220px] relative overflow-hidden">
                                        <div className="absolute top-5 left-5 bg-white/95 backdrop-blur px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider text-[#8E2A8B] shadow-sm z-10">
                                            {item.step}
                                        </div>
                                        <img
                                            src={item.img}
                                            alt={item.title}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                    </div>
                                    <div className="p-7">
                                        <h3 className="text-xl font-bold text-[#2c2c2c] mb-3">{item.title}</h3>
                                        <p className="text-[#666] leading-relaxed text-[15px]">{item.desc}</p>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>

                    <div className="text-center mt-12 text-xl font-medium text-[#8E2A8B] opacity-90 tracking-wide">
                        Smooth execution. Emotional resonance. Long-term relationships.
                    </div>
                </div>
            </section>

            {/* Offerings */}
            <section className="pt-10 pb-20 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-black text-[#2D1B4E] mb-4">Curated Offerings</h2>
                        <p className="text-gray-600">Diverse options for every budget and occasion.</p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {[
                            { title: "Artisan Heritage Collections", desc: "Terracotta, palm crafts, brass décor and handwoven textiles." },
                            { title: "Wellness & Care Packs", desc: "Herbal soaps, natural foods, handcrafted accessories." },
                            { title: "Desk & Workspace Gifts", desc: "Minimalist décor, handcrafted stationery, utility crafts." },
                            { title: "Festival & Milestone Gifts", desc: "Custom festive gifting with regional specialties." },
                            { title: "Custom Co-Branded Gifts", desc: "Personalised packaging with brand story inserts." },
                            { title: "Employee Onboarding Kits", desc: "Welcome new team members with sustainable essentials." }
                        ].map((item, idx) => (
                            <div key={idx} className="p-6 border border-gray-100 rounded-xl hover:shadow-lg transition-all group">
                                <Gift className="text-[#8E2A8B] mb-4 group-hover:scale-110 transition-transform" size={28} />
                                <h3 className="text-xl font-bold text-[#2D1B4E] mb-2">{item.title}</h3>
                                <p className="text-gray-600">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Process Section */}
            <section className="py-20 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-black text-[#2D1B4E] mb-4">How We Work</h2>
                        <p className="text-gray-600">A seamless process from inquiry to delivery.</p>
                    </div>

                    <div className="grid md:grid-cols-5 gap-4 max-w-6xl mx-auto">
                        {[
                            { icon: Users, step: "01", title: "Connect", desc: "Share your requirements & budget." },
                            { icon: Gift, step: "02", title: "Curate", desc: "Build a custom gift theme." },
                            { icon: FileText, step: "03", title: "Branding", desc: "Add logo & personal notes." },
                            { icon: Truck, step: "04", title: "Delivery", desc: "We handle logistics & shipping." },
                            { icon: Heart, step: "05", title: "Report", desc: "Receive an impact report." }
                        ].map((item, idx) => (
                            <div key={idx} className="relative bg-white p-6 rounded-xl text-center shadow-sm z-10">
                                <span className="absolute -top-3 -right-3 text-4xl font-bold text-gray-100 z-0">{item.step}</span>
                                <div className="relative z-10">
                                    <div className="w-12 h-12 bg-[#F8F0FF] rounded-full flex items-center justify-center text-[#8E2A8B] mx-auto mb-4">
                                        <item.icon size={20} />
                                    </div>
                                    <h3 className="font-bold text-[#2D1B4E] mb-1">{item.title}</h3>
                                    <p className="text-xs text-gray-500">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Audience Section - Redesigned */}
            <section className="py-[60px] lg:py-[100px] bg-white border-b overflow-hidden">
                <div className="container mx-auto px-4 max-w-6xl">
                    <div className="text-center mb-16">
                        <h2 className="text-[28px] lg:text-[48px] font-bold text-[#2D1B4E] leading-tight mb-4">
                            For Companies That Value People
                        </h2>
                        <div className="w-[80px] h-[1px] bg-[#8E2A8B]/30 mx-auto mb-6"></div>
                        <p className="text-[#6B7280] text-lg lg:text-xl max-w-2xl mx-auto">
                            Purpose-driven gifting designed to strengthen culture, leadership, and belonging.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-[24px] lg:gap-[40px]">
                        {[
                            {
                                icon: Building2,
                                title: "DEI & Social Responsibility",
                                desc: "Gifts that reflect purpose, equity & meaningful impact."
                            },
                            {
                                icon: UserCheck,
                                title: "Authentic Leadership",
                                desc: "Human-centered gifting that strengthens workplace culture."
                            },
                            {
                                icon: Briefcase,
                                title: "Human Narrative",
                                desc: "Gifts that express identity and create emotional resonance."
                            },
                            {
                                icon: Gift,
                                title: "Culture & Craftsmanship",
                                desc: "Appreciation rooted in heritage and artisan-made products."
                            }
                        ].map((item, idx) => (
                            <div
                                key={idx}
                                className="bg-white rounded-[14px] p-8 shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-[6px] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] group flex flex-col items-start border border-gray-50"
                            >
                                <div className="w-[50px] h-[50px] rounded-full bg-[#8E2A8B]/10 flex items-center justify-center mb-6 transition-colors duration-300 group-hover:bg-[#8E2A8B]/20">
                                    <item.icon className="text-[#8E2A8B] transition-all duration-300 group-hover:scale-110" size={26} />
                                </div>
                                <h3 className="text-xl lg:text-[22px] font-semibold text-[#2D1B4E] mb-3">
                                    {item.title}
                                </h3>
                                <p className="text-[#6B7280] text-[15px] lg:text-base leading-1.6">
                                    {item.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>


            {/* Corporate Collections Section */}
            <section className="pt-20 pb-10 bg-gradient-to-b from-white to-[#FDFBF7] overflow-hidden">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl md:text-5xl font-black text-[#2D1B4E] mb-4">Our Corporate Collections</h2>
                        <p className="text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed">
                            Thoughtfully curated corporate gift collections that celebrate craftsmanship, wellbeing, culture, and meaningful connections.
                        </p>
                    </div>

                    <div className="relative max-w-[1400px] mx-auto group">
                        {/* Navigation Buttons - Visible on hover/always on touch */}
                        <button
                            onClick={() => {
                                document.getElementById('ccTrack')?.scrollBy({ left: -360, behavior: 'smooth' });
                            }}
                            className="absolute left-0 md:-left-5 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-gray-100 flex items-center justify-center text-2xl z-20 hover:bg-[#8E2A8B] hover:text-white transition-all hover:scale-110 active:scale-95 hidden md:flex"
                            aria-label="Previous"
                        >
                            <ChevronLeft size={32} />
                        </button>

                        <button
                            onClick={() => {
                                document.getElementById('ccTrack')?.scrollBy({ left: 360, behavior: 'smooth' });
                            }}
                            className="absolute right-0 md:-right-5 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-gray-100 flex items-center justify-center text-2xl z-20 hover:bg-[#8E2A8B] hover:text-white transition-all hover:scale-110 active:scale-95 hidden md:flex"
                            aria-label="Next"
                        >
                            <ChevronRight size={32} />
                        </button>

                        {/* Carousel Track */}
                        <div
                            id="ccTrack"
                            className="flex gap-8 overflow-x-auto pb-10 px-4 pt-4 scroll-smooth snap-x snap-mandatory scrollbar-hide"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            {[
                                {
                                    icon: Palmtree,
                                    title: "Artisan Heritage Hampers",
                                    desc: "Terracotta, palm crafts, brass décor and handwoven textiles.",
                                    tag: "Perfect for: Leadership gifting, cultural events"
                                },
                                {
                                    icon: Sparkles,
                                    title: "Wellness & Care Packs",
                                    desc: "Herbal soaps, natural foods, handcrafted accessories.",
                                    tag: "Perfect for: Employee wellness"
                                },
                                {
                                    icon: Monitor,
                                    title: "Desk & Workspace Gifts",
                                    desc: "Minimalist décor, handcrafted stationery, utility crafts.",
                                    tag: "Perfect for: Onboarding & welcome kits"
                                },
                                {
                                    icon: Star,
                                    title: "Festival & Milestone Hampers",
                                    desc: "Custom festive gifting with regional specialties.",
                                    tag: "Perfect for: Diwali, New Year"
                                },
                                {
                                    icon: Tag,
                                    title: "Custom Co-Branded Gifts",
                                    desc: "Personalised packaging with brand story inserts.",
                                    tag: "Perfect for: Conferences & campaigns"
                                }
                            ].map((item, idx) => (
                                <article key={idx} className="min-w-[300px] md:min-w-[360px] bg-white rounded-[20px] overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_25px_50px_rgba(142,42,139,0.15)] hover:-translate-y-3 transition-all duration-500 border border-gray-100 flex flex-col snap-center h-full group">
                                    <div className="h-[200px] w-full flex items-center justify-center bg-[#F8F0FF] group-hover:bg-[#8E2A8B] transition-colors duration-500 shrink-0">
                                        <item.icon className="w-20 h-20 text-[#8E2A8B] group-hover:text-white transition-all duration-500 transform group-hover:scale-110" />
                                    </div>
                                    <div className="p-8 flex-1 flex flex-col">
                                        <h3 className="text-2xl font-bold text-[#1A1A1A] mb-4 leading-tight">{item.title}</h3>
                                        <p className="text-[#555] leading-relaxed mb-6 text-[15px] flex-grow">{item.desc}</p>
                                        <div className="mt-auto">
                                            <div className="inline-block bg-[#F8F0FF] text-[#8E2A8B] font-bold text-[11px] uppercase tracking-wider px-4 py-2.5 rounded-xl">
                                                {item.tag}
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="pt-10 pb-20 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-4xl font-black text-[#2D1B4E] mb-4">Loved by Our Community</h2>
                        <p className="text-gray-600 text-lg">What customers say about our craftsmanship and impact.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                        {testimonials.map((review) => (
                            <div key={review.id} className="bg-[#FDFBF7] border border-black/5 rounded-2xl p-8 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_15px_30px_rgba(0,0,0,0.08)] hover:border-[#8E2A8B]/30 flex flex-col items-center">
                                <img
                                    src={review.image}
                                    alt={review.name}
                                    className="w-full h-[350px] object-cover object-top rounded-xl mb-6 shadow-sm"
                                />
                                <div className="text-yellow-400 text-xl tracking-widest mb-4">
                                    {'★'.repeat(review.rating || 5)}
                                </div>
                                <h3 className="text-lg font-bold text-[#1A1A1A] mb-1">{review.name}</h3>
                                <div className="text-xs uppercase font-bold text-[#8E2A8B] tracking-wider mb-6">{review.role}</div>
                                <p className="text-[#555] italic leading-relaxed text-[15px]">
                                    “{review.content}”
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section className="py-24 bg-gray-50" id="contact-form">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
                        <div className="md:w-1/3 bg-[#2D1B4E] text-white p-10 flex flex-col justify-between">
                            <div>
                                <h3 className="text-2xl font-bold mb-4">Partner With Us</h3>
                                <p className="text-white/80 mb-8 leading-relaxed">Let's create something meaningful together. Fill out the form and our team will reach out within 24 hours.</p>
                            </div>
                            <div className="space-y-4 text-sm text-white/70">
                                <p>Email: b2b@kottravai.in</p>
                                <p>Phone: +91 97870 30811</p>
                            </div>
                        </div>
                        <div className="md:w-2/3 p-10">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <input
                                        type="text" placeholder="Contact Name *" required
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#8E2A8B]"
                                        value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                    <input
                                        type="email" placeholder="Email Address *" required
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#8E2A8B]"
                                        value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <input
                                        type="tel" placeholder="Phone Number *" required
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#8E2A8B]"
                                        value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                    <input
                                        type="text" placeholder="Business / Store Name"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#8E2A8B]"
                                        value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })}
                                    />
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <input
                                        type="text" placeholder="Products Interested In *" required
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#8E2A8B]"
                                        value={formData.products} onChange={e => setFormData({ ...formData, products: e.target.value })}
                                    />
                                    <input
                                        type="text" placeholder="Approx Order Quantity *" required
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#8E2A8B]"
                                        value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                                    />
                                </div>
                                <input
                                    type="text" placeholder="Location *" required
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#8E2A8B]"
                                    value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })}
                                />
                                <textarea
                                    rows={3} placeholder="Additional Notes"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#8E2A8B]"
                                    value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                ></textarea>

                                <button type="submit" className="w-full bg-[#8E2A8B] text-white font-bold py-4 rounded-lg hover:bg-[#6d1e6a] transition flex items-center justify-center gap-2">
                                    <Send size={18} /> Submit Inquiry
                                </button>
                                {message && (
                                    <p className={`text-center text-sm ${status === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                                        {message}
                                    </p>
                                )}
                            </form>
                        </div>
                    </div>
                </div>
            </section>
        </MainLayout>
    );
};

export default B2B;
