import { lazy, Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import MainLayout from '@/layouts/MainLayout';

// ─── ABOVE FOLD: load eagerly (LCP-critical, first paint) ────────────────────
import HeroSlider from '@/components/home/HeroSlider';
import BestSellers from '@/components/home/BestSellers';

// ─── BELOW FOLD: lazy load (never block first paint) ─────────────────────────
// Each lazy chunk is only fetched after the browser has rendered the hero + best sellers.
const GiftBundleBuilder = lazy(() => import('@/components/home/GiftBundleBuilder'));
const GiftHampers       = lazy(() => import('@/components/home/GiftHampers'));
const JournalSection    = lazy(() => import('@/components/home/JournalSection'));
const Testimonials      = lazy(() => import('@/components/home/Testimonials'));
const ValueProps        = lazy(() => import('@/components/home/ValueProps'));

const Home = () => {
    return (
        <MainLayout>
            <Helmet>
                <title>Kottravai | Handmade Crafts, Eco Products &amp; Traditional Food Mixes.</title>
                <meta name="description" content="Kottravai offers premium handcrafted terracotta jewellery, heritage mixes, and essential care products. Shop our exclusive collection today." />
            </Helmet>

            {/* 1. Hero — EAGER, LCP element lives here */}
            <HeroSlider />

            {/* 2. Best Sellers — EAGER, visible above fold on desktop */}
            <BestSellers />

            {/* 3–7. Everything below is below the fold on all devices → lazy */}

            <Suspense fallback={null}>
                <GiftBundleBuilder />
            </Suspense>

            {/* WhatsApp Banner — static HTML, no JS cost */}
            <div className="w-full py-8 px-4 md:px-8">
                <div className="max-w-[1240px] mx-auto">
                    <a
                        href="https://whatsapp.com/channel/0029VbAxfDt6rsQwQdzLjS2m"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block hover:opacity-95 transition-opacity"
                    >
                        <img
                            src="/whatsapp-banner.webp"
                            alt="Join Kottravai WhatsApp Community"
                            className="w-full h-auto object-cover shadow-sm"
                            loading="lazy"
                            decoding="async"
                        />
                    </a>
                </div>
            </div>

            <Suspense fallback={null}>
                <GiftHampers />
            </Suspense>

            <Suspense fallback={null}>
                <JournalSection />
            </Suspense>

            <Suspense fallback={null}>
                <Testimonials />
            </Suspense>

            <Suspense fallback={null}>
                <ValueProps />
            </Suspense>

        </MainLayout>
    );
};

export default Home;

