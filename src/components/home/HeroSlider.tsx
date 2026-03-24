import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const HeroSlider = () => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const slides: {
        image: string;
        alt: string;
        link: string;
        title?: string;
        titleAccent?: string;
        subtitle?: string;
        buttonText?: string;
        showTextOverlay?: boolean;
    }[] = [
            {
                image: '/hero.webp',
                alt: 'Handcrafted Terracotta Jewellery',
                link: '/category/terracotta-ornaments'
            },
            {
                image: '/uploads/2026/01/banner-2.webp',
                alt: 'Crafted from Coconut',
                link: '/category/coco-crafts',
                showTextOverlay: false
            }
        ];

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % slides.length);
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    };

    useEffect(() => {
        const timer = setInterval(nextSlide, 5000);
        return () => clearInterval(timer);
    }, []);

    return (
        <section className="relative w-full h-[250px] sm:h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden group">
            {slides.map((slide, index) => (
                <div
                    key={index}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                        }`}
                >
                    <a href={slide.link} className="block w-full h-full">
                        <img
                            src={slide.image}
                            alt={slide.alt}
                            className="w-full h-full object-cover"
                            // First slide = LCP element: eager + high priority
                            // Subsequent slides = off-screen: lazy
                            loading={index === 0 ? 'eager' : 'lazy'}
                            // @ts-ignore - React 18 types don't include fetchpriority but it's needed to fix console warnings
                            fetchpriority={index === 0 ? 'high' : 'low'}
                            decoding={index === 0 ? 'sync' : 'async'}
                        />
                    </a>
                    {slide.showTextOverlay && (
                        <div className="absolute inset-0 flex items-center pointer-events-none">
                            <div className="container mx-auto px-4 sm:px-8 md:px-12 lg:px-20 pointer-events-auto">
                                <div className="max-w-xl space-y-3 sm:space-y-4 md:space-y-6">
                                    <div className="space-y-1">
                                        <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-serif text-[#3d2419] leading-tight text-shadow-sm">
                                            {slide.title}
                                        </h2>
                                        <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-serif text-[#3d2419] leading-tight text-shadow-sm">
                                            {slide.titleAccent}
                                        </h2>
                                    </div>
                                    <p className="text-sm sm:text-base md:text-lg lg:text-xl text-[#3d2419]/90 max-w-md font-medium">
                                        {slide.subtitle}
                                    </p>
                                    <div className="pt-2 md:pt-4">
                                        <a
                                            href={slide.link}
                                            className="inline-flex items-center px-4 py-2 sm:px-6 sm:py-3 bg-[#3d2419] text-white rounded font-medium hover:bg-[#2a1811] transition-all transform hover:-translate-y-1 shadow-lg"
                                        >
                                            <span className="text-sm sm:text-base">{slide.buttonText}</span>
                                            <ChevronRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ))}

            {/* Navigation Arrows */}
            <button
                onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 rounded-full bg-white/30 backdrop-blur-sm text-[#2D1B4E] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white z-20"
            >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button
                onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 rounded-full bg-white/30 backdrop-blur-sm text-[#2D1B4E] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white z-20"
            >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Indicators */}
            <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 sm:space-x-3 z-20">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`transition-all duration-300 rounded-full h-1.5 sm:h-2 ${index === currentIndex ? 'bg-[#3d2419] w-6 sm:w-8' : 'bg-[#3d2419]/20 w-1.5 sm:w-2'
                            }`}
                    />
                ))}
            </div>
        </section>
    );
};

export default HeroSlider;
