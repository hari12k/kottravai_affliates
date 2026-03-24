/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_RAZORPAY_KEY_ID: string
    readonly VITE_API_URL: string
    readonly VITE_ANALYTICS_URL: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

declare module 'lucide-react';
