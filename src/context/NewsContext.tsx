
import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { journalData } from '../data/homeData';
import { safeSetItem, safeGetItem } from '@/utils/storage';

export interface NewsItem {
    id: number;
    title: string;
    category: string;
    date: string;
    image: string;
    link: string;
    description?: string; // Adding optional description/excerpt if needed later
}

interface NewsContextType {
    newsItems: NewsItem[];
    addNewsItem: (item: Omit<NewsItem, 'id'>) => void;
    updateNewsItem: (item: NewsItem) => void;
    deleteNewsItem: (id: number) => void;
}

const NewsContext = createContext<NewsContextType | undefined>(undefined);

export const NewsProvider = ({ children }: { children: ReactNode }) => {
    // Load from local storage or default to homeData
    const [newsItems, setNewsItems] = useState<NewsItem[]>(() => {
        const saved = safeGetItem('kottravai_news');
        if (saved) {
            const parsedSaved = JSON.parse(saved);
            // Sync with initial data to pick up image path updates in development
            return parsedSaved.map((p: NewsItem) => {
                const initial = journalData.posts.find(ip => ip.id === p.id);
                if (initial && initial.image !== p.image) {
                    return { ...p, image: initial.image };
                }
                return p;
            });
        }
        return journalData.posts;
    });

    useEffect(() => {
        safeSetItem('kottravai_news', JSON.stringify(newsItems));
    }, [newsItems]);

    const addNewsItem = (item: Omit<NewsItem, 'id'>) => {
        const newItem = { ...item, id: Date.now() };
        setNewsItems(prev => [newItem, ...prev]);
    };

    const updateNewsItem = (updatedItem: NewsItem) => {
        setNewsItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    };

    const deleteNewsItem = (id: number) => {
        setNewsItems(prev => prev.filter(item => item.id !== id));
    };

    return (
        <NewsContext.Provider value={{ newsItems, addNewsItem, updateNewsItem, deleteNewsItem }}>
            {children}
        </NewsContext.Provider>
    );
};

export const useNews = () => {
    const context = useContext(NewsContext);
    if (context === undefined) {
        throw new Error('useNews must be used within a NewsProvider');
    }
    return context;
};
