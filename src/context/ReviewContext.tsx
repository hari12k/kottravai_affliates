
import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { testimonials as homeTestimonials } from '../data/homeData';
import { safeSetItem, safeGetItem } from '@/utils/storage';

export interface Review {
    id: number;
    name: string;
    role: string; // e.g., "Entrepreneur - Kovilpatti" or just "Customer"
    content: string;
    image: string;
    page: 'home' | 'b2b';
    rating?: number; // Optional, useful for B2B which has stars
}

// B2B Initial Data (extracted from B2B.tsx)
const b2bTestimonials: Review[] = [
    {
        id: 101,
        name: "Kaliappan K",
        role: "Founder , Sprint 6 & Nammaloo",
        content: "Kottravai has been a reliable B2B partner for us. Their coconut shell products stand out for quality, consistency, and premium finish. Our corporate clients appreciated the sustainability angle, and repeat orders came in quickly",
        image: "/b1.jpeg",
        page: 'b2b',
        rating: 5
    },
    {
        id: 102,
        name: "Jaya Shakthi",
        role: "Founder , CDIX",
        content: "Working with Kottravai has been seamless. From sampling to bulk delivery, their team maintained quality and timelines. The handcrafted coconut shell products added a unique, eco-conscious value to our corporate gifting range.",
        image: "/b2.jpeg",
        page: 'b2b',
        rating: 5
    },
    {
        id: 103,
        name: "Radha Lakshmi",
        role: "CEO , SPIKRA",
        content: "Kottravai’s terracotta jewellery reflects responsible craftsmanship. The natural materials, artisan-led production, and ethical sourcing aligned perfectly with our sustainability goals.",
        image: "/b3.jpeg",
        page: 'b2b',
        rating: 5
    }
];

// Combine initial data
const initialData: Review[] = [
    ...homeTestimonials.map(t => ({ ...t, page: 'home' as const })),
    ...b2bTestimonials
];

interface ReviewContextType {
    reviews: Review[];
    addReview: (review: Omit<Review, 'id'>) => void;
    updateReview: (review: Review) => void;
    deleteReview: (id: number) => void;
    getReviewsByPage: (page: 'home' | 'b2b') => Review[];
}

const ReviewContext = createContext<ReviewContextType | undefined>(undefined);

export const ReviewProvider = ({ children }: { children: ReactNode }) => {
    // Load from local storage or default to initialData
    const [reviews, setReviews] = useState<Review[]>(() => {
        const saved = safeGetItem('kottravai_reviews');
        if (saved) {
            const parsedSaved = JSON.parse(saved);
            // Sync with initialData to pick up image path updates in development
            return parsedSaved.map((r: Review) => {
                const initial = initialData.find(ir => ir.id === r.id);
                if (initial && initial.image !== r.image) {
                    return { ...r, image: initial.image };
                }
                return r;
            });
        }
        return initialData;
    });

    useEffect(() => {
        safeSetItem('kottravai_reviews', JSON.stringify(reviews));
    }, [reviews]);

    const addReview = (review: Omit<Review, 'id'>) => {
        const newReview = { ...review, id: Date.now() };
        setReviews(prev => [newReview, ...prev]);
    };

    const updateReview = (updatedReview: Review) => {
        setReviews(prev => prev.map(r => r.id === updatedReview.id ? updatedReview : r));
    };

    const deleteReview = (id: number) => {
        setReviews(prev => prev.filter(r => r.id !== id));
    };

    const getReviewsByPage = (page: 'home' | 'b2b') => {
        return reviews.filter(r => r.page === page);
    };

    return (
        <ReviewContext.Provider value={{ reviews, addReview, updateReview, deleteReview, getReviewsByPage }}>
            {children}
        </ReviewContext.Provider>
    );
};

export const useReviews = () => {
    const context = useContext(ReviewContext);
    if (context === undefined) {
        throw new Error('useReviews must be used within a ReviewProvider');
    }
    return context;
};
