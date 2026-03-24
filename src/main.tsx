import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.tsx'
import './styles/index.css'

import { CartProvider } from './context/CartContext'
import { ProductProvider } from './context/ProductContext'
import { VideoProvider } from './context/VideoContext'
import { NewsProvider } from './context/NewsContext'
import { ReviewProvider } from './context/ReviewContext'
import { OrderProvider } from './context/OrderContext'
import { PartnerProvider } from './context/PartnerContext'
import { AuthProvider } from './context/AuthContext'
import { WishlistProvider } from './context/WishlistContext'
// Analytics initialization handled by analyticsService.ts singleton
// No manual init required here

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <HelmetProvider>
            <BrowserRouter>
                <AuthProvider>
                    <ProductProvider>
                        <CartProvider>
                            <VideoProvider>
                                <NewsProvider>
                                    <PartnerProvider>
                                        <ReviewProvider>
                                            <OrderProvider>
                                                <WishlistProvider>
                                                    <App />
                                                </WishlistProvider>
                                            </OrderProvider>
                                        </ReviewProvider>
                                    </PartnerProvider>
                                </NewsProvider>
                            </VideoProvider>
                        </CartProvider>
                    </ProductProvider>
                </AuthProvider>
            </BrowserRouter>
        </HelmetProvider>
    </React.StrictMode>,
)
