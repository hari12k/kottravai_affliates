import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react';
import { CartItem } from './CartContext';
import { useAuth } from './AuthContext';
import { supabase } from '@/utils/supabaseClient';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export interface Order {
    id: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    address?: string;
    city?: string;
    pincode?: string;
    items: CartItem[];
    total: number;
    status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
    date: string;
    paymentId?: string;
    orderId?: string;
    shiprocketOrderId?: string;
    shipmentId?: string;
    zoneName?: string;
}

interface OrderContextType {
    orders: Order[];
    adminOrders: Order[];
    addOrder: (order: Omit<Order, 'id' | 'date' | 'status'>) => Promise<void>;
    updateOrderStatus: (id: string, status: Order['status']) => Promise<void>;
    deleteOrder: (id: string) => Promise<void>;
    refreshOrders: () => Promise<void>;
    fetchAllOrders: (force?: boolean) => Promise<void>;
    loading: boolean;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider = ({ children }: { children: ReactNode }) => {
    const { user, isAuthenticated } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [adminOrders, setAdminOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);
    const hasFetchedOrders = useRef(false);
    const hasFetchedAdminOrders = useRef(false);

    const fetchOrders = useCallback(async () => {
        if (!user?.email || hasFetchedOrders.current) return;
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            const response = await axios.get(`${API_URL}/orders`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrders(response.data);
            hasFetchedOrders.current = true;
        } catch (error) {
            console.error("Failed to fetch user orders", error);
        }
    }, [user?.email]);

    const lastAdminFetchRef = useRef<number>(0);
    const fetchAllOrders = useCallback(async (force = false) => {
        const recentlyFetched = Date.now() - lastAdminFetchRef.current < 30000;
        if (!force && hasFetchedAdminOrders.current) return;
        if (force && recentlyFetched) {
            console.log('🛡️ Throttling admin orders fetch');
            return;
        }

        lastAdminFetchRef.current = Date.now();

        try {
            const adminPass = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';
            const response = await axios.get(`${API_URL}/orders`, {
                headers: { 'X-Admin-Secret': adminPass }
            });
            setAdminOrders(response.data);
            hasFetchedAdminOrders.current = true;
        } catch (error) {
            console.error("Failed to fetch all orders for admin", error);
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated && user?.email) {
            setLoading(true);

            // Only fetch what's needed for the current user
            if (!hasFetchedOrders.current) {
                fetchOrders().finally(() => {
                    setLoading(false);
                    hasFetchedOrders.current = true;
                });
            }

            // Polling for live updates only if authenticated
            const interval = setInterval(() => {
                fetchOrders();
            }, 60000); // Increased interval to 1 minute
            return () => clearInterval(interval);
        } else {
            setOrders([]);
            // Only clear admin orders if we're not even in admin mode
            if (sessionStorage.getItem('kottravai_admin_session') !== 'true') {
                setAdminOrders([]);
            }
        }
    }, [isAuthenticated, user?.email]);

    const addOrder = async (orderData: Omit<Order, 'id' | 'date' | 'status'>) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            const response = await axios.post(`${API_URL}/orders`, orderData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrders(prev => [response.data, ...prev]);
            fetchAllOrders(true); // Sync admin view
        } catch (error) {
            console.error("Failed to add order", error);
            throw error;
        }
    };

    const updateOrderStatus = async (id: string, status: Order['status']) => {
        try {
            const adminPass = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';
            await axios.put(`${API_URL}/orders/${id}`, { status }, {
                headers: { 'X-Admin-Secret': adminPass }
            });
            setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
            setAdminOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
        } catch (error) {
            console.error("Failed to update order status", error);
            throw error;
        }
    };

    const deleteOrder = async (id: string) => {
        try {
            const adminPass = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';
            await axios.delete(`${API_URL}/orders/${id}`, {
                headers: { 'X-Admin-Secret': adminPass }
            });
            setOrders(prev => prev.filter(o => o.id !== id));
            setAdminOrders(prev => prev.filter(o => o.id !== id));
        } catch (error) {
            console.error("Failed to delete order", error);
            throw error;
        }
    };

    const contextValue = useMemo(() => ({
        orders,
        adminOrders,
        addOrder,
        updateOrderStatus,
        deleteOrder,
        refreshOrders: fetchOrders,
        fetchAllOrders,
        loading
    }), [orders, adminOrders, fetchOrders, fetchAllOrders, loading]);

    return (
        <OrderContext.Provider value={contextValue}>
            {children}
        </OrderContext.Provider>
    );
};

export const useOrders = () => {
    const context = useContext(OrderContext);
    if (!context) {
        throw new Error('useOrders must be used within a OrderProvider');
    }
    return context;
};

