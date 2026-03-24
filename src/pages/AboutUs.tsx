import { ChevronLeft, ChevronRight, MapPin, ArrowRight, Target, Lightbulb } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';
import { useState, useEffect } from 'react';
import VideoGallery from '@/components/home/VideoGallery';
import TrustedPartners from '@/components/home/TrustedPartners';

const TeamSlider = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [visibleCards, setVisibleCards] = useState(4);
    const totalCards = teamMembers.length;

    useEffect(() => {

        const handleResize = () => {
            if (window.innerWidth < 640) setVisibleCards(1);
            else if (window.innerWidth < 1024) setVisibleCards(2);
            else if (window.innerWidth < 1280) setVisibleCards(3);
            else setVisibleCards(4);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % (totalCards - visibleCards + 1));
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + (totalCards - visibleCards + 1)) % (totalCards - visibleCards + 1));
    };

    return (
        <div className="relative max-w-[1200px] mx-auto px-4 md:px-10">
            <div className="overflow-hidden">
                <div
                    className="flex transition-transform duration-[1000ms] ease-in-out"
                    style={{ transform: `translateX(-${currentIndex * (100 / visibleCards)}%)` }}
                >
                    {teamMembers.map((member, idx) => (
                        <div
                            key={`${member.name}-${idx}`}
                            className="flex-shrink-0 px-4 text-center group"
                            style={{ width: `${100 / visibleCards}%` }}
                        >
                            <div className="w-52 h-52 mx-auto rounded-full overflow-hidden border-4 border-gray-100 mb-6 shadow-lg group-hover:border-[#8E2A8B]/30 transition-all duration-500">
                                <img
                                    src={member.image}
                                    alt={member.name}
                                    className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-700"
                                />
                            </div>
                            <div className="px-1">
                                <h4 className="font-bold text-[#2D1B4E] text-lg mb-1">{member.name}</h4>
                                <p className="text-gray-500 text-sm font-medium tracking-wide">{member.role}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Navigation Buttons */}
            {totalCards > visibleCards && (
                <>
                    <button
                        onClick={prevSlide}
                        className="absolute top-1/2 -left-2 md:left-0 transform -translate-y-1/2 p-3 rounded-full bg-white shadow-lg text-[#2D1B4E] hover:bg-[#2D1B4E] hover:text-white transition-all z-10 border border-gray-100"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={nextSlide}
                        className="absolute top-1/2 -right-2 md:right-0 transform -translate-y-1/2 p-3 rounded-full bg-white shadow-lg text-[#2D1B4E] hover:bg-[#2D1B4E] hover:text-white transition-all z-10 border border-gray-100"
                    >
                        <ChevronRight size={20} />
                    </button>
                </>
            )}
        </div>
    );
};

const AdvisoryPanelSlider = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [visibleCards, setVisibleCards] = useState(3);
    const totalCards = advisoryPanel.length;

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) setVisibleCards(1);
            else if (window.innerWidth < 1280) setVisibleCards(2);
            else setVisibleCards(3);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const nextSlide = () => {
        if (currentIndex < totalCards - visibleCards) {
            setCurrentIndex(currentIndex + 1);
        } else {
            setCurrentIndex(0);
        }
    };

    const prevSlide = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        } else {
            setCurrentIndex(totalCards - visibleCards);
        }
    };

    return (
        <div className="relative group/carousel">
            <div className="overflow-hidden px-4">
                <div
                    className="flex transition-all duration-700 ease-in-out gap-6"
                    style={{ transform: `translateX(-${currentIndex * (100 / visibleCards)}%)` }}
                >
                    {advisoryPanel.map((doc, idx) => (
                        <div
                            key={idx}
                            className="flex-shrink-0"
                            style={{ width: `calc(${100 / visibleCards}% - ${(6 * (visibleCards - 1)) / visibleCards}px)` }}
                        >
                            <div className="bg-white rounded-2xl p-8 shadow-[0_15px_40px_rgba(0,0,0,0.03)] border border-gray-50 flex flex-col h-full hover:shadow-[0_25px_50px_rgba(142,42,139,0.08)] transition-all duration-500 group">
                                <div className="relative mb-8 -mx-8 -mt-8 overflow-hidden rounded-t-2xl h-80">
                                    <img
                                        src={doc.image}
                                        alt={doc.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                                        style={{ objectPosition: doc.imagePos }}
                                    />

                                </div>

                                <div className="text-center mb-6">
                                    <h3 className="text-lg font-black text-[#2D1B4E] mb-1.5">{doc.name}</h3>
                                    <div className="inline-block bg-[#F8F0FF] px-3 py-1 rounded-full border border-purple-100">
                                        <p className="text-[#8B2C84] font-black text-[9px] uppercase tracking-widest">{doc.role}</p>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-8 flex-grow">
                                    <p className="text-[#8B2C84] italic font-serif text-sm font-bold text-center leading-relaxed opacity-80">
                                        {doc.quote}
                                    </p>
                                    <p className="text-gray-500 text-[13px] leading-relaxed font-semibold text-center opacity-70">
                                        {doc.desc}
                                    </p>
                                </div>

                                <div className="bg-gray-50/80 rounded-xl p-5 border border-gray-100 group-hover:bg-purple-50/30 transition-colors duration-500">
                                    <p className="text-[9px] font-black uppercase text-[#2D1B4E] tracking-[0.2em] mb-3 opacity-40 text-center">{doc.focusTitle}</p>
                                    <ul className="space-y-2.5">
                                        {doc.focusItems.map((item, i) => (
                                            <li key={i} className="flex items-center gap-2.5 text-[11.5px] font-bold text-[#2D1B4E]/70">
                                                <div className="w-1 h-1 rounded-full bg-[#8B2C84] shrink-0"></div>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Navigation Controls */}
            {totalCards > visibleCards && (
                <div className="flex justify-center items-center gap-4 mt-12">
                    <button
                        onClick={prevSlide}
                        className="w-12 h-12 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center text-[#2D1B4E] hover:bg-[#8B2C84] hover:text-white transition-all duration-300"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={nextSlide}
                        className="w-12 h-12 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center text-[#2D1B4E] hover:bg-[#8B2C84] hover:text-white transition-all duration-300"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}
        </div>
    );
};

const AboutUs = () => {
    return (
        <MainLayout>
            <div className="bg-white">
                {/* About Intro Section */}
                <section className="relative py-20 overflow-hidden">
                    <div className="container mx-auto px-4 relative z-10">
                        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
                            {/* Left Content */}
                            <div className="space-y-8">
                                <h2 className="text-4xl md:text-5xl lg:text-5xl font-black text-[#2D1B4E] leading-tight">
                                    We build dignified livelihoods<br className="hidden lg:block" /> through <span className="text-[#8E2A8B]">craft.</span>
                                </h2>

                                <p className="text-lg text-gray-600 leading-relaxed max-w-2xl">
                                    Kottravai is a women-led platform that creates eco-friendly handmade products while empowering women who were previously engaged in beedi rolling to earn sustainable
                                    and independent incomes. Our mission is to help them move away from hazardous working conditions and build healthier livelihoods.
                                    We believe that economic dignity strengthens families, preserves traditional skills, and helps build resilient communities.
                                </p>

                                <div className="flex flex-col sm:flex-row gap-8 pt-4">
                                    <div className="border-l-4 border-[#8E2A8B] pl-4 py-1">
                                        <strong className="text-[#2D1B4E] font-bold text-lg block">Women-Led</strong>
                                        <span className="text-gray-500 text-sm">Built by women, for women</span>
                                    </div>
                                    <div className="border-l-4 border-[#8E2A8B] pl-4 py-1">
                                        <strong className="text-[#2D1B4E] font-bold text-lg block">Handcrafted</strong>
                                        <span className="text-gray-500 text-sm">Rooted in artisan skill</span>
                                    </div>
                                    <div className="border-l-4 border-[#8E2A8B] pl-4 py-1">
                                        <strong className="text-[#2D1B4E] font-bold text-lg block">Sustainable</strong>
                                        <span className="text-gray-500 text-sm">Designed with natural materials</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right Visual */}
                            <div className="relative">
                                <div className="rounded-[2rem] overflow-hidden shadow-2xl">
                                    <img
                                        src="/ab.jpg"
                                        alt="Kottravai women artisans"
                                        className="w-full h-auto object-cover"
                                        loading="lazy"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Impact Strip */}
                        <div className="relative bg-[#2D1B4E] rounded-2xl p-10 shadow-xl flex flex-col md:flex-row justify-around items-center gap-8 text-center max-w-5xl mx-auto">
                            <div className="flex flex-col items-center">
                                <strong className="text-5xl font-black text-[#FFD700] mb-1">35+</strong>
                                <span className="text-white/90 font-bold uppercase tracking-widest text-xs">Women Artisans</span>
                            </div>
                            <div className="hidden md:block w-px h-12 bg-white/20"></div>
                            <div className="flex flex-col items-center">
                                <strong className="text-5xl font-black text-[#FFD700] mb-1">100%</strong>
                                <span className="text-white/90 font-bold uppercase tracking-widest text-xs">Handmade Products</span>
                            </div>
                            <div className="hidden md:block w-px h-12 bg-white/20"></div>
                            <div className="flex flex-col items-center">
                                <strong className="text-5xl font-black text-[#FFD700] mb-1">90+</strong>
                                <span className="text-white/90 font-bold uppercase tracking-widest text-xs">Products</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Our Impact Section - Premium Redesign */}
                <section className="py-24 bg-[#FAF9F6] relative overflow-hidden">
                    {/* Artistic background elements */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#8E2A8B]/5 rounded-full blur-[120px] -mr-64 -mt-64"></div>
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#2D1B4E]/5 rounded-full blur-[120px] -ml-64 -mb-64 opacity-50"></div>

                    <div className="container mx-auto px-4 max-w-7xl relative z-10">
                        <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
                            <div className="max-w-2xl">
                                <div className="inline-block px-4 py-1.5 bg-[#F8F0FF] rounded-full border border-purple-100 mb-6">
                                    <p className="text-[#8E2A8B] font-black uppercase tracking-[0.3em] text-[10px]">Purpose Driven</p>
                                </div>
                                <h2 className="text-4xl md:text-6xl font-black text-[#2D1B4E] leading-[1.1] tracking-tight">
                                    Measuring <br className="hidden lg:block" /> Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8E2A8B] to-[#2D1B4E]">Social Impact</span>
                                </h2>
                            </div>
                            <p className="text-gray-500 max-w-sm font-medium leading-relaxed text-lg">
                                We measure success not just in sales, but in the livelihoods we uplift and the traditions we preserve through every artisan creation.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                {
                                    title: "Women Empowered",
                                    desc: "Rural women transition from hazardous Beedi work into safe, skilled, and dignified livelihoods.",
                                    image: "/women_empowerment.jpg",
                                    bgColor: "#F8F0FF"
                                },
                                {
                                    title: "Health & Wellbeing",
                                    desc: "Reduced exposure to toxic environments leads to improved physical health and quality of life.",
                                    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1000&auto=format&fit=crop",
                                    bgColor: "#FFF5F5"
                                },
                                {
                                    title: "Stable Livelihoods",
                                    desc: "Consistent income and skill development bring long-term financial security to families.",
                                    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1000&auto=format&fit=crop",
                                    bgColor: "#F0F7FF"
                                },
                                {
                                    title: "Sustainable Future",
                                    desc: "Eco-friendly materials and ethical production support communities and the planet together.",
                                    image: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?q=80&w=1000&auto=format&fit=crop",
                                    bgColor: "#F0FFF4"
                                }
                            ].map((item, idx) => (
                                <div
                                    key={idx}
                                    className="group relative bg-white rounded-2xl p-8 shadow-[0_10px_40px_rgba(0,0,0,0.02)] border border-white hover:border-[#8E2A8B]/30 hover:shadow-[0_40px_80px_rgba(142,42,139,0.15)] transition-all duration-700 flex flex-col items-center text-center overflow-hidden"
                                >
                                    {/* Shorter Image Background Wrapper */}
                                    <div className="absolute inset-0 h-56 overflow-hidden" style={{ backgroundColor: item.bgColor }}>
                                        <img
                                            src={item.image}
                                            alt=""
                                            className="w-full h-full object-cover opacity-80 transition-all duration-1000 group-hover:scale-110"
                                            onError={(e) => (e.currentTarget.style.display = 'none')}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-white/80 to-white"></div>
                                    </div>

                                    <div className="relative z-10 pt-44 pb-4 flex flex-col items-center">
                                        <h3 className="text-xl font-black text-[#2D1B4E] mb-3 tracking-tight group-hover:text-[#8E2A8B] transition-colors duration-500">
                                            {item.title}
                                        </h3>
                                        <p className="text-gray-500 text-[14px] leading-relaxed font-semibold opacity-90 max-w-[240px]">
                                            {item.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Mission & Vision */}
                <section className="pt-16 pb-10 bg-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#8E2A8B]/4 rounded-full blur-[140px] -mr-80 -mt-80 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#2D1B4E]/4 rounded-full blur-[120px] -ml-64 -mb-64 pointer-events-none"></div>

                    <div className="container mx-auto px-4 max-w-7xl relative z-10">
                        {/* Section Header */}
                        <div className="text-center max-w-2xl mx-auto mb-20">
                            <div className="inline-block px-4 py-1.5 bg-[#F8F0FF] rounded-full border border-purple-100 mb-6">
                                <p className="text-[#8E2A8B] font-black uppercase tracking-[0.3em] text-[10px]">Our Purpose</p>
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black text-[#2D1B4E] leading-tight mb-4">
                                Mission &amp; <span className="text-[#8E2A8B]">Vision</span>
                            </h2>
                            <p className="text-gray-500 font-medium leading-relaxed">
                                Rooted in purpose, driven by impact — everything we do begins with why.
                            </p>
                        </div>

                        {/* Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto">
                            {/* Mission Card */}
                            <div className="group relative bg-[#F8F0FF] rounded-3xl p-10 border border-purple-100 hover:border-[#8E2A8B]/30 hover:shadow-[0_30px_60px_rgba(142,42,139,0.12)] transition-all duration-700 flex flex-col">
                                <div className="w-14 h-14 rounded-2xl bg-[#8E2A8B] flex items-center justify-center mb-8 shadow-lg group-hover:scale-110 transition-transform duration-500">
                                    <Target size={26} strokeWidth={1.5} className="text-white" />
                                </div>
                                <div className="inline-block px-3 py-1 bg-[#8E2A8B]/10 rounded-full mb-4">
                                    <span className="text-[#8E2A8B] font-black text-[9px] uppercase tracking-[0.25em]">Mission</span>
                                </div>
                                <h3 className="text-2xl font-black text-[#2D1B4E] mb-4 leading-tight">
                                    Dignified Livelihoods Through Craft
                                </h3>
                                <p className="text-gray-600 text-[15px] leading-relaxed font-medium flex-grow">
                                    To empower rural women artisans by providing sustainable, skilled livelihoods through eco-friendly handmade products — enabling them to earn independent incomes while preserving traditional crafts and building resilient communities.
                                </p>
                            </div>

                            {/* Vision Card */}
                            <div className="group relative bg-[#2D1B4E] rounded-3xl p-10 border border-[#2D1B4E] hover:shadow-[0_30px_60px_rgba(45,27,78,0.25)] transition-all duration-700 flex flex-col">
                                <div className="w-14 h-14 rounded-2xl bg-[#8E2A8B] flex items-center justify-center mb-8 shadow-lg group-hover:scale-110 transition-transform duration-500">
                                    <Lightbulb size={26} strokeWidth={1.5} className="text-white" />
                                </div>
                                <div className="inline-block px-3 py-1 bg-white/10 rounded-full mb-4">
                                    <span className="text-white/80 font-black text-[9px] uppercase tracking-[0.25em]">Vision</span>
                                </div>
                                <h3 className="text-2xl font-black text-white mb-4 leading-tight">
                                    A World Where Craft Creates Change
                                </h3>
                                <p className="text-white/75 text-[15px] leading-relaxed font-medium flex-grow">
                                    To be India's leading women-led artisan platform — where every handcrafted product is a symbol of sustainability, cultural pride, and economic empowerment, inspiring a global movement toward conscious and purposeful living.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Our Hubs Section */}
                <section className="pt-10 pb-20 bg-white">
                    <div className="container mx-auto px-4 max-w-7xl">

                        {/* Section Header — centered */}
                        <div className="text-center max-w-[600px] mx-auto mb-14">
                            <h2 className="text-4xl md:text-5xl font-black text-[#2D1B4E] leading-tight mb-4">
                                Our <span className="text-[#8E2A8B]">Hubs</span>
                            </h2>
                            <p className="text-gray-500 text-base font-medium leading-relaxed">
                                Empowering communities across our growing network of artisan centers.
                            </p>
                        </div>

                        {/* Editorial 4-col card grid — 4 desktop / 2 tablet / 1 mobile */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
                            {[
                                {
                                    name: "Coconut Shell Hub",
                                    location: "Mathalamparai, Tamil Nadu",
                                    desc: "Hub creates eco-friendly coconut shell crafts and sustainable handmade products from natural coconut shells.",
                                    image: "/tenkasi_hub.jpg",
                                    link: "https://www.google.com/maps/place/Kottravai+Coconut+shell+Hub/@8.9120647,77.3283595,17z/data=!3m1!4b1!4m6!3m5!1s0x3b04296f48133015:0x80520f72a6db9382!8m2!3d8.9120594!4d77.3309344!16s%2Fg%2F11ynb__x7l?entry=ttu&g_ep=EgoyMDI2MDMwOS4wIKXMDSoASAFQAw%3D%3D"
                                },
                                {
                                    name: "Teracotta Hub",
                                    location: "Surandai, Tamil Nadu",
                                    desc: "Hub creates artistic terracotta jewelry and sustainable handmade products from natural earthen clay.",
                                    image: "/teracotta_hub.jpg",
                                    link: "https://www.google.com/maps/place/8%C2%B058'03.5%22N+77%C2%B026'08.6%22E/@8.9676823,77.435197,18.85z/data=!4m4!3m3!8m2!3d8.9676267!4d77.4357233?hl=en&entry=ttu&g_ep=EgoyMDI2MDMwOS4wIKXMDSoASAFQAw%3D%3D"
                                },
                                {
                                    name: "Banana fiber hub",
                                    location: "Sankarankovil, Tamil Nadu",
                                    desc: "Hub creates eco-friendly banana fiber crafts and sustainable handmade products from natural banana fibers.",
                                    image: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?q=80&w=800&auto=format&fit=crop",
                                    link: "#"
                                },
                                {
                                    name: "Food hub",
                                    location: "Chennai, Tamil Nadu",
                                    desc: "Our central design studio and logistics coordination center.",
                                    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800&auto=format&fit=crop",
                                    link: "#"
                                }
                            ].map((hub, idx) => (
                                <div key={idx} className="group flex flex-col">

                                    {/* Image — full width, fixed height, slight zoom on hover */}
                                    <div className="w-full h-52 overflow-hidden rounded-sm mb-5">
                                        <img
                                            src={hub.image}
                                            alt={hub.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                            onError={(e) => (e.currentTarget.style.display = 'none')}
                                        />
                                    </div>

                                    {/* Hub Name */}
                                    <a
                                        href={hub.link}
                                        target={hub.link.startsWith('http') ? "_blank" : "_self"}
                                        rel={hub.link.startsWith('http') ? "noopener noreferrer" : ""}
                                        className="block group-hover:text-[#8E2A8B] transition-colors duration-300"
                                    >
                                        <h3 className="text-[17px] font-bold text-[#2D1B4E] mb-1.5 leading-snug">
                                            {hub.name}
                                        </h3>
                                    </a>

                                    {/* Location */}
                                    <a
                                        href={hub.link}
                                        target={hub.link.startsWith('http') ? "_blank" : "_self"}
                                        rel={hub.link.startsWith('http') ? "noopener noreferrer" : ""}
                                        className="flex items-center gap-1.5 mb-3 hover:opacity-80 transition-opacity"
                                    >
                                        <MapPin size={12} className="text-[#8E2A8B] shrink-0" />
                                        <span className="text-[#8E2A8B] text-[12px] font-semibold">{hub.location}</span>
                                    </a>

                                    {/* Description */}
                                    <p className="text-gray-500 text-[14px] leading-relaxed mb-4 flex-grow">
                                        {hub.desc}
                                    </p>

                                    {/* View Hub → underline link */}
                                    <a
                                        href={hub.link}
                                        target={hub.link.startsWith('http') ? "_blank" : "_self"}
                                        rel={hub.link.startsWith('http') ? "noopener noreferrer" : ""}
                                        className="group/link inline-flex items-center gap-1.5 text-[#2D1B4E] font-semibold text-[14px] underline underline-offset-4 decoration-[#2D1B4E]/30 hover:decoration-[#8E2A8B] hover:text-[#8E2A8B] transition-all duration-300 w-fit"
                                    >
                                        View Hub
                                        <ArrowRight
                                            size={14}
                                            className="group-hover/link:translate-x-1 transition-transform duration-300"
                                        />
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Team Section */}
                <section className="py-20 bg-gray-50 overflow-hidden">
                    <div className="container mx-auto px-4 mb-16">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <h2 className="text-3xl md:text-5xl font-black text-[#2D1B4E] mb-6">
                                Our Team
                            </h2>
                            <p className="text-lg text-gray-600">
                                Meet the artisans, designers, and visionaries shaping the future of sustainable craft.
                            </p>
                        </div>

                        {/* 3 Main Images - Static */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 text-center">
                            <div className="space-y-4">
                                <div className="rounded-2xl overflow-hidden h-[400px] shadow-lg">
                                    <img src="/team/team-3.jpg" alt="Sridhar Vembu" className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-[#2D1B4E]">Sridhar Vembu</h3>
                                    <p className="text-[#8B2C84] font-medium">Chief Mentor</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="rounded-2xl overflow-hidden h-[400px] shadow-lg">
                                    <img src="/team/team-1.jpg" alt="Ananthan Ayyasamy" className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-[#2D1B4E]">Ananthan Ayyasamy</h3>
                                    <p className="text-[#8B2C84] font-medium">Co-Founder</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="rounded-2xl overflow-hidden h-[400px] shadow-lg">
                                    <img src="/team/team-2.jpg" alt="Karunya Gunavathy" className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-[#2D1B4E]">Karunya Gunavathy</h3>
                                    <p className="text-[#8B2C84] font-medium">CEO & Co-Founder</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="container mx-auto px-4">
                        <TeamSlider />
                    </div>
                </section>

                {/* Advisory Panel Section */}
                <section className="py-12 lg:py-20 bg-gray-50 overflow-hidden relative">
                    {/* Background blob */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white rounded-full blur-3xl opacity-60 pointer-events-none"></div>

                    <div className="container mx-auto px-4 relative z-10">
                        <div className="text-center max-w-3xl mx-auto mb-20">
                            <span className="text-sm font-black text-[#8B2C84] uppercase tracking-[0.3em] mb-4 block">Scientific Guidance</span>
                            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-[#2D1B4E] mb-6">Medical Advisory Panel</h2>
                            <p className="text-xl text-gray-600 font-light leading-relaxed">Our formulations are guided by traditional wisdom and validated by modern medical experts.</p>
                        </div>

                        <AdvisoryPanelSlider />
                    </div>
                </section>



                {/* Trusted By */}
                <TrustedPartners />

                {/* Watch Kottravai in Action */}
                <VideoGallery />

                {/* What Makes Kottravai Different Section */}
                <section className="py-[90px] px-5 bg-white">
                    <div className="max-w-[1200px] mx-auto">
                        <header className="text-center max-w-[720px] mx-auto mb-[70px]">
                            <span className="text-[13px] tracking-[.18em] uppercase text-[#8E2A8B] font-bold block">
                                OUR DIFFERENCE
                            </span>
                            <h2 className="text-[28px] md:text-[38px] font-extrabold text-[#2D1B4E] my-3.5">
                                What Makes Kottravai Different
                            </h2>
                            <p className="text-[#555] text-lg leading-[1.7]">
                                Kottravai stands at the intersection of tradition, sustainability,
                                and women-led craftsmanship — creating products with purpose and impact.
                            </p>
                        </header>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 auto-rows-auto lg:auto-rows-[260px] gap-[26px]">
                            <article className="lg:col-span-2 lg:row-span-2 relative p-[26px] flex flex-col bg-white border-[1.8px] border-[#8E2A8B] rounded-[14px] overflow-hidden">
                                <div className="relative z-10">
                                    <h3 className="text-[18px] font-bold text-[#2D1B4E] mb-2">Sustainable by Nature</h3>
                                    <p className="text-[14.8px] leading-[1.65] text-[#555]">
                                        Our products are created using eco-friendly, responsibly sourced
                                        materials that honour nature and reduce environmental impact.<br /><br />
                                        We work with natural, biodegradable, and responsibly sourced materials, ensuring minimal
                                        environmental impact while maintaining durability and timeless appeal.
                                    </p>
                                </div>
                                <div className="w-full h-[200px] lg:h-[260px] mt-auto pt-5">
                                    <img
                                        src="/Picture1.webp"
                                        alt="Sustainable production"
                                        className="w-full h-full object-cover rounded-lg"
                                        loading="lazy"
                                        decoding="async"
                                    />
                                </div>
                            </article>

                            <article className="group relative min-h-[220px] p-[26px] flex flex-col bg-white border-[1.8px] border-[#8E2A8B] rounded-[16px] overflow-hidden transition-all duration-300 hover:shadow-[0_24px_60px_rgba(142,42,139,0.18)] hover:border-transparent">
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-450 z-0">
                                    <div className="absolute inset-0 bg-gradient-to-b from-[#2D1B4E]/30 to-[#2D1B4E]/90 z-10"></div>
                                    <img src="/Picture2.webp" alt="Women artisans" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                                </div>
                                <div className="relative z-20">
                                    <h3 className="text-[18px] font-bold text-[#2D1B4E] mb-2 group-hover:text-white group-hover:drop-shadow-md transition-colors">Women-Led Craftsmanship</h3>
                                    <p className="text-[14.8px] leading-[1.65] text-[#555] group-hover:text-white/95 group-hover:drop-shadow-md transition-colors">
                                        Every Kottravai product is handcrafted by skilled rural women,
                                        ensuring ethical production and dignified livelihoods.
                                    </p>
                                </div>
                            </article>

                            <article className="group relative min-h-[220px] p-[26px] flex flex-col bg-white border-[1.8px] border-[#8E2A8B] rounded-[16px] overflow-hidden transition-all duration-300 hover:shadow-[0_24px_60px_rgba(142,42,139,0.18)] hover:border-transparent">
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-450 z-0">
                                    <div className="absolute inset-0 bg-gradient-to-b from-[#2D1B4E]/30 to-[#2D1B4E]/90 z-10"></div>
                                    <img src="/Picture3.webp" alt="Eco creation" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                                </div>
                                <div className="relative z-20">
                                    <h3 className="text-[18px] font-bold text-[#2D1B4E] mb-2 group-hover:text-white group-hover:drop-shadow-md transition-colors">Eco-Conscious Creation</h3>
                                    <p className="text-[14.8px] leading-[1.65] text-[#555] group-hover:text-white/95 group-hover:drop-shadow-md transition-colors">
                                        We prioritise slow, mindful production that respects resources,
                                        communities, and future generations.
                                    </p>
                                </div>
                            </article>

                            <article className="group relative min-h-[220px] p-[26px] flex flex-col bg-white border-[1.8px] border-[#8E2A8B] rounded-[16px] overflow-hidden transition-all duration-300 hover:shadow-[0_24px_60px_rgba(142,42,139,0.18)] hover:border-transparent">
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-450 z-0">
                                    <div className="absolute inset-0 bg-gradient-to-b from-[#2D1B4E]/30 to-[#2D1B4E]/90 z-10"></div>
                                    <img src="/Picture4.webp" alt="Ethical practices" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                                </div>
                                <div className="relative z-20">
                                    <h3 className="text-[18px] font-bold text-[#2D1B4E] mb-2 group-hover:text-white group-hover:drop-shadow-md transition-colors">Ethical Practices</h3>
                                    <p className="text-[14.8px] leading-[1.65] text-[#555] group-hover:text-white/95 group-hover:drop-shadow-md transition-colors">
                                        Fair wages, transparency, and respect guide every partnership
                                        and production decision we make.
                                    </p>
                                </div>
                            </article>

                            <article className="group relative min-h-[220px] p-[26px] flex flex-col bg-white border-[1.8px] border-[#8E2A8B] rounded-[16px] overflow-hidden transition-all duration-300 hover:shadow-[0_24px_60px_rgba(142,42,139,0.18)] hover:border-transparent">
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-450 z-0">
                                    <div className="absolute inset-0 bg-gradient-to-b from-[#2D1B4E]/30 to-[#2D1B4E]/90 z-10"></div>
                                    <img src="/Picture5.webp" alt="Purpose impact" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                                </div>
                                <div className="relative z-20">
                                    <h3 className="text-[18px] font-bold text-[#2D1B4E] mb-2 group-hover:text-white group-hover:drop-shadow-md transition-colors">Purpose-Driven Impact</h3>
                                    <p className="text-[14.8px] leading-[1.65] text-[#555] group-hover:text-white/95 group-hover:drop-shadow-md transition-colors">
                                        Each purchase directly supports women’s independence,
                                        traditional crafts, and conscious living.
                                    </p>
                                </div>
                            </article>
                        </div>
                    </div>
                </section>

                {/* Final CTA Section */}
                <section className="py-20 px-4 bg-white overflow-hidden">
                    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-16 items-center">
                        <div className="text-center md:text-left">
                            <span className="inline-block text-sm font-bold uppercase tracking-[2px] text-[#8E2A8B] mb-5 bg-[#F8F0FF] px-4 py-2 rounded-full">
                                OUR COMMITMENT
                            </span>
                            <h2 className="text-4xl md:text-5xl font-black leading-tight mb-6 text-[#2D1B4E]">
                                Join the Kottravai Movement
                            </h2>
                            <p className="text-lg leading-relaxed mb-10 text-gray-600 max-w-lg mx-auto md:mx-0">
                                Every purchase is more than a transaction—it’s a contribution to change.
                                Support women. Preserve tradition. Choose sustainability.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-5 justify-center md:justify-start">
                                <a
                                    className="inline-block px-8 py-4 rounded-lg font-semibold text-center transition-all duration-300 bg-[#8E2A8B] text-white shadow-[0_4px_15px_rgba(142,42,139,0.3)] hover:bg-[#6d1e6a] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(142,42,139,0.4)]"
                                    href="https://kottravai.in/product-category/handicrafts/"
                                >
                                    Explore Our Handcrafted Collections
                                </a>
                                <a
                                    className="inline-block px-8 py-4 rounded-lg font-semibold text-center transition-all duration-300 bg-transparent text-[#8E2A8B] border border-[#8E2A8B] hover:bg-[#F8F0FF] hover:text-[#6d1e6a] hover:border-[#6d1e6a]"
                                    href="https://kottravai.in/b2b/"
                                >
                                    Get in Touch With Us
                                </a>
                            </div>
                        </div>
                        <div className="relative h-[350px] md:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
                            <img
                                src="/4.webp"
                                alt="Kottravai artisans and craftsmanship"
                                className="w-full h-full object-cover"
                                loading="lazy"
                                decoding="async"
                            />
                        </div>

                    </div>
                </section>
            </div>
        </MainLayout>
    );
};

const advisoryPanel = [
    {
        name: "Dr. Saranya",
        role: "Product Formulator & Nutritionist",
        image: "/doc1.jpg",
        imagePos: "top",
        quote: "\"Food is the first medicine.\"",
        desc: "As our lead formulator, Dr. Saranya ensures every Kottravai edible product balances traditional wisdom with modern nutritional integrity.",
        focusTitle: "Kottravai Expertise",
        focusItems: ["Therapeutic nutrition", "Bioactive ingredients", "Preventive health"]
    },
    {
        name: "Dr. N. Venthan",
        role: "Integrative Medicine Specialist",
        image: "/doc2.jpeg",
        imagePos: "center 20%",
        quote: "\"Holistic harmony through nature.\"",
        desc: "An Integrative Medicine Specialist (BNYS) who brings holistic strategy to Kottravai's wellness expansion and natural restoration.",
        focusTitle: "Kottravai Expertise",
        focusItems: ["Holistic healing strategy", "Natural restoration", "Yoga-based wellness"]
    },
    {
        name: "Dr. Mounisha",
        role: "Medical Advisor (MBBS/MD)",
        image: "/doc3.jpeg",
        imagePos: "top",
        quote: "\"Safety first, nature always.\"",
        desc: "Practicing in Obstetrics & Gynaecology, Dr. Mounisha validates the safety of Kottravai products for women's clinical purity standards.",
        focusTitle: "Kottravai Expertise",
        focusItems: ["Clinical purity validation", "Women's health safety", "Standardized medical hygiene"]
    }
];

const teamMembers = [
    {
        name: "Ahamed Musharaf Ali",
        role: "Product Manager",
        image: "/team/member-3.jpg"
    },
    {
        name: "Santhosh",
        role: "Developer",
        image: "/team/member-1.jpg"
    },

    {
        name: "Gnana Jency",
        role: "Hub Manager",
        image: "/team/gnana_jency.jpg"
    },
    {
        name: "Shunmuga Priya",
        role: "Production Manager",
        image: "/team/member-5.jpg"
    },
    {
        name: "Jayanthi",
        role: "QC Head",
        image: "/team/member-4.jpg"
    }
];

export default AboutUs;
