import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/utils/supabaseClient';
import axios from 'axios';
import analytics from '@/utils/analyticsService';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface User {
    id: string;
    username: string;
    email: string;
    fullName: string;
    mobile?: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isLoginModalOpen: boolean;
    openLoginModal: () => void;
    closeLoginModal: () => void;
    login: (email: string, password: string) => Promise<{ error: any }>;
    signUp: (username: string, email: string, password: string, otp: string) => Promise<{ error: any }>;
    sendEmailOTP: (email: string, type?: 'signup' | 'forgot') => Promise<{ error: any }>;
    verifyEmailOTP: (email: string, otp: string) => Promise<{ error: any }>;
    resetPasswordWithOTP: (email: string, otp: string, newPassword: string) => Promise<{ error: any }>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    const openLoginModal = () => setIsLoginModalOpen(true);
    const closeLoginModal = () => setIsLoginModalOpen(false);

    useEffect(() => {
        const fetchSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const u = session.user;
                setUser({
                    id: u.id,
                    username: u.email || u.id, // Use email as unique identifier for cart/wishlist keys
                    email: u.email || '',
                    fullName: u.user_metadata?.full_name || u.user_metadata?.username || '',
                    mobile: u.user_metadata?.mobile || ''
                });
            }
            setIsLoading(false);
        };

        fetchSession();

        const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                const u = session.user;
                setUser({
                    id: u.id,
                    username: u.email || u.id, // Use email as unique identifier for cart/wishlist keys
                    email: u.email || '',
                    fullName: u.user_metadata?.full_name || u.user_metadata?.username || '',
                    mobile: u.user_metadata?.mobile || ''
                });
                analytics.setUserId(u.id);
            } else {
                setUser(null);
                analytics.setUserId(null);
            }
            setIsLoading(false);
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: email.toLowerCase(),
                password
            });

            if (error) {
                analytics.trackEvent('login_failed', { email, error: error.message });
                throw error;
            }
            analytics.trackEvent('login_success', { email });
            closeLoginModal();
            return { error: null };
        } catch (error: any) {
            console.error('Login error:', error);
            return { error };
        }
    };

    const signUp = async (username: string, email: string, password: string, otp: string) => {
        try {
            // Call backend to create user
            await axios.post(`${API_BASE}/auth/register`, {
                username,
                email: email.toLowerCase(),
                password,
                otp
            });

            // Automatically log in after successful signup
            const { error: loginError } = await login(email, password);
            if (loginError) throw loginError;

            analytics.trackEvent('account_created', { username, email });
            return { error: null };
        } catch (error: any) {
            console.error('Signup error:', error);
            return { error: error.response?.data?.error || error.message || 'Signup failed' };
        }
    };

    const sendEmailOTP = async (email: string, type: 'signup' | 'forgot' = 'signup') => {
        try {
            const response = await axios.post(`${API_BASE}/auth/send-email-otp`, {
                email: email.toLowerCase(),
                type
            });
            return { error: null, data: response.data };
        } catch (error: any) {
            console.error('Send Email OTP error:', error);
            return { error: error.response?.data || { message: 'Failed to send OTP' } };
        }
    };

    const verifyEmailOTP = async (email: string, otp: string) => {
        try {
            const response = await axios.post(`${API_BASE}/auth/verify-email-otp`, { email: email.toLowerCase(), otp });
            return { error: null, data: response.data };
        } catch (error: any) {
            console.error('Verify Email OTP error:', error);
            return { error: error.response?.data || { message: 'Invalid OTP' } };
        }
    };

    const resetPasswordWithOTP = async (email: string, otp: string, newPassword: string) => {
        try {
            const response = await axios.post(`${API_BASE}/auth/reset-password-with-otp`, {
                email: email.toLowerCase(),
                otp,
                newPassword
            });
            return { error: null, data: response.data };
        } catch (error: any) {
            console.error('Reset password error:', error);
            return { error: error.response?.data || { message: 'Failed to reset password' } };
        }
    };

    const logout = async () => {
        analytics.trackEvent('logout');
        await supabase.auth.signOut();
        setUser(null);
        analytics.setUserId(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            isLoading,
            isLoginModalOpen,
            openLoginModal,
            closeLoginModal,
            login,
            signUp,
            sendEmailOTP,
            verifyEmailOTP,
            resetPasswordWithOTP,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
