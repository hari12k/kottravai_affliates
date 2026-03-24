import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { trustedPartners as initialPartners } from '@/data/homeData';
import { safeSetItem, safeGetItem } from '@/utils/storage';

export interface Partner {
    id: number;
    name: string;
    logo: string | null;
}

interface PartnerContextType {
    partners: Partner[];
    addPartner: (partner: Omit<Partner, 'id'>) => void;
    updatePartner: (partner: Partner) => void;
    deletePartner: (id: number) => void;
}

const PartnerContext = createContext<PartnerContextType | undefined>(undefined);

export const PartnerProvider = ({ children }: { children: ReactNode }) => {
    const [partners, setPartners] = useState<Partner[]>(() => {
        const saved = safeGetItem('kottravai_partners');
        if (saved) {
            const parsedSaved = JSON.parse(saved);
            // Sync with initialPartners to pick up new logo additions in development
            return parsedSaved.map((p: Partner) => {
                const initial = initialPartners.find(ip => ip.id === p.id);
                if (initial && initial.logo && (!p.logo || p.logo === 'null')) {
                    return { ...p, logo: initial.logo };
                }
                return p;
            });
        }
        return initialPartners;
    });

    useEffect(() => {
        safeSetItem('kottravai_partners', JSON.stringify(partners));
    }, [partners]);

    const addPartner = (partner: Omit<Partner, 'id'>) => {
        const newPartner: Partner = {
            ...partner,
            id: Date.now()
        };
        setPartners(prev => [...prev, newPartner]);
    };

    const updatePartner = (updatedPartner: Partner) => {
        setPartners(prev => prev.map(p => p.id === updatedPartner.id ? updatedPartner : p));
    };

    const deletePartner = (id: number) => {
        setPartners(prev => prev.filter(p => p.id !== id));
    };

    return (
        <PartnerContext.Provider value={{ partners, addPartner, updatePartner, deletePartner }}>
            {children}
        </PartnerContext.Provider>
    );
};

export const usePartners = () => {
    const context = useContext(PartnerContext);
    if (!context) {
        throw new Error('usePartners must be used within a PartnerProvider');
    }
    return context;
};
