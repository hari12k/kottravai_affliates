import { useState, useEffect, Fragment } from 'react';
import { useProducts } from '@/context/ProductContext';
import { useVideos } from '@/context/VideoContext';
import { useNews } from '@/context/NewsContext';
import { useReviews } from '@/context/ReviewContext';
import { useOrders } from '../../context/OrderContext';
import { usePartners } from '@/context/PartnerContext';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Image as ImageIcon, Trash2, X, Upload, Pencil, MessageSquareQuote, Package, ShoppingBag, ChevronDown, ChevronUp, LayoutDashboard, TrendingUp, DollarSign, Handshake, Video, Newspaper, Users, UserCheck, Phone, Instagram, Facebook, Twitter, Youtube, Linkedin, LogOut, Search, Bell, Activity, ArrowUpRight, ArrowDownRight, MoreVertical, Calendar, Clock, MessageCircle, FileText } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { categories } from '@/data/products';
import toast from 'react-hot-toast';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
// import { supabase } from '@/utils/supabaseClient';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { products, addProduct, deleteProduct, updateProduct, updateStock, fetchProducts } = useProducts();
    const { videos, addVideo, deleteVideo, updateVideo } = useVideos();
    const { newsItems, addNewsItem, deleteNewsItem, updateNewsItem } = useNews();
    const { addReview, deleteReview, updateReview, getReviewsByPage } = useReviews();
    const { adminOrders: orders, updateOrderStatus, deleteOrder, fetchAllOrders } = useOrders();
    const { partners, addPartner, updatePartner, deletePartner } = usePartners();

    const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean | null>(null);
    const [view, setView] = useState<'dashboard' | 'list' | 'add' | 'videos' | 'news' | 'reviews' | 'stocks' | 'orders' | 'partners' | 'users' | 'whatsapp-helper' | 'alliance-apps' | 'affiliates' | 'affiliate-partners' | 'affiliate-dashboard' | 'affiliate-withdrawals'>('dashboard');

    // Admin Session Guard
    useEffect(() => {
        const isAdmin = sessionStorage.getItem('kottravai_admin_session') === 'true';
        if (!isAdmin) {
            navigate('/admin/login');
        } else {
            setIsAdminAuthenticated(true);
            // Fetch all orders and products specifically for admin use
            fetchAllOrders();
            fetchProducts();
        }
    }, [navigate, fetchAllOrders, fetchProducts]);

    const handleLogout = () => {
        sessionStorage.removeItem('kottravai_admin_session');
        navigate('/admin/login');
    };

    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'draft'>('all');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [quickEditId, setQuickEditId] = useState<string | null>(null);
    const [quickEditForm, setQuickEditForm] = useState({
        name: '',
        price: '',
        isBestSeller: false,
        isGiftBundleItem: false,
        isLive: true
    });

    // Video Form State
    const [newVideo, setNewVideo] = useState({ title: '', url: '' });
    const [editingVideoId, setEditingVideoId] = useState<number | null>(null);

    // News Form State
    const [newsForm, setNewsForm] = useState({ title: '', category: '', date: '', image: '', link: '' });
    const [editingNewsId, setEditingNewsId] = useState<number | null>(null);

    // Review Form State
    const [reviewPage, setReviewPage] = useState<'home' | 'b2b'>('home');
    const [reviewForm, setReviewForm] = useState({ name: '', role: '', content: '', image: '', rating: 5 });
    const [editingReviewId, setEditingReviewId] = useState<number | null>(null);

    // Partner Form State
    const [partnerForm, setPartnerForm] = useState({ name: '', logo: '' });
    const [editingPartnerId, setEditingPartnerId] = useState<number | null>(null);

    // Alliance Applications state
    const [allianceApps, setAllianceApps] = useState<any[]>([]);

    const fetchAllianceApps = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL || '/api'}/alliance`, {
                headers: { 'x-admin-secret': sessionStorage.getItem('kottravai_admin_token') || 'admin123' }
            });
            setAllianceApps(response.data);
        } catch (error) {
            console.error('Failed to fetch alliance apps:', error);
        }
    };

    // Affiliate Applications state
    const [affiliateApplications, setAffiliateApplications] = useState<any[]>([]);

    const fetchAffiliateApplications = async () => {
        try {
            const adminSecret = sessionStorage.getItem('kottravai_admin_token') || 'admin123';
            const response = await axios.get(`${import.meta.env.VITE_API_URL || '/api'}/affiliates/admin/applications`, {
                headers: { 'X-Admin-Secret': adminSecret }
            });
            if (response.data.success) {
                setAffiliateApplications(response.data.applications);
            }
        } catch (error) {
            console.error('Failed to fetch affiliate applications:', error);
            toast.error('Failed to load affiliate applications');
        }
    };

    const handleUpdateAffiliateStatus = async (id: string, status: string) => {
        try {
            const adminSecret = sessionStorage.getItem('kottravai_admin_token') || 'admin123';
            await axios.put(`${import.meta.env.VITE_API_URL || '/api'}/affiliates/admin/applications/${id}`, 
                { status },
                { headers: { 'X-Admin-Secret': adminSecret } }
            );
            toast.success(`Application marked as ${status}`);
            fetchAffiliateApplications();
            if (status === 'Approved') fetchAffiliates(); // Refresh partners if approved
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    // Active Affiliates state
    const [activeAffiliates, setActiveAffiliates] = useState<any[]>([]);

    const fetchAffiliates = async () => {
        try {
            const adminSecret = sessionStorage.getItem('kottravai_admin_token') || 'admin123';
            const response = await axios.get(`${import.meta.env.VITE_API_URL || '/api'}/affiliates/admin/affiliates`, {
                headers: { 'X-Admin-Secret': adminSecret }
            });
            if (response.data.success) {
                setActiveAffiliates(response.data.affiliates);
            }
        } catch (error) {
            console.error('Failed to fetch active affiliates:', error);
        }
    };

    const handleUpdateAffiliateLevel = async (affiliateId: string, newLevel: string) => {
        try {
            const adminSecret = sessionStorage.getItem('kottravai_admin_token') || 'admin123';
            await axios.put(`${import.meta.env.VITE_API_URL || '/api'}/affiliates/admin/affiliates/${affiliateId}`, 
                { level: newLevel },
                { headers: { 'X-Admin-Secret': adminSecret } }
            );
            toast.success(`Level updated to ${newLevel}`);
            fetchAffiliates();
        } catch (error) {
            toast.error('Failed to update level');
        }
    };

    // Affiliate Sales state
    const [affiliateSales, setAffiliateSales] = useState<any[]>([]);

    const fetchAffiliateSales = async () => {
        try {
            const adminSecret = sessionStorage.getItem('kottravai_admin_token') || 'admin123';
            const response = await axios.get(`${import.meta.env.VITE_API_URL || '/api'}/affiliates/admin/sales`, {
                headers: { 'X-Admin-Secret': adminSecret }
            });
            if (response.data.success) {
                setAffiliateSales(response.data.sales || []);
            }
        } catch (error) {
            console.error('Failed to fetch affiliate sales:', error);
            // Don't show toast automatically on background fetch to avoid spamming
        }
    };

    // Affiliate Withdrawals state
    const [withdrawals, setWithdrawals] = useState<any[]>([]);

    const fetchWithdrawals = async () => {
        try {
            const adminSecret = sessionStorage.getItem('kottravai_admin_token') || 'admin123';
            const response = await axios.get(`${import.meta.env.VITE_API_URL || '/api'}/affiliates/admin/withdrawals`, {
                headers: { 'X-Admin-Secret': adminSecret }
            });
            
            console.log('📡 [DEBUG] Withdrawal Logs Fetch:', {
                status: response.status,
                count: response.data?.withdrawals?.length || 0,
                data: response.data
            });

            if (response.data.success) {
                setWithdrawals(response.data.withdrawals || []);
            }
        } catch (error: any) {
            console.error('🚨 [DEBUG] Failed to fetch withdrawals:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data
            });
            toast.error('Failed to load withdrawal data');
        }
    };

    const updateWithdrawalStatus = async (id: string, status: string, notes: string = '') => {
        try {
            const adminSecret = sessionStorage.getItem('kottravai_admin_token') || 'admin123';
            const response = await axios.put(`${import.meta.env.VITE_API_URL || '/api'}/affiliates/admin/withdrawals/${id}`, {
                status,
                adminNotes: notes
            }, {
                headers: { 'X-Admin-Secret': adminSecret }
            });

            if (response.data.success) {
                toast.success(`Withdrawal marked as ${status}`);
                fetchWithdrawals();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to update withdrawal');
        }
    };

    useEffect(() => {
        if (view === 'alliance-apps') {
            fetchAllianceApps();
        }
        if (view === 'affiliates') {
            fetchAffiliateApplications();
        }
        if (view === 'affiliate-partners' || view === 'affiliate-dashboard') {
            fetchAffiliates();
        }
        if (view === 'affiliate-dashboard') {
            fetchAffiliateSales();
        }
        if (view === 'affiliate-withdrawals') {
            console.log('🔄 Fetching withdrawals and dependencies...');
            fetchWithdrawals();
            fetchAffiliates(); // Need affiliates list for manual entry
        }
    }, [view]);

    // Innovative State
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAffiliateFilter, setSelectedAffiliateFilter] = useState<string>('all');
    const [showNotifications, setShowNotifications] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'analytics'>('overview');

    const generateInvoice = async (order: any) => {
        const invoiceId = `INV-${Date.now().toString(36).toUpperCase()}`;
        const dateStr = new Date(order.date || Date.now()).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'long', year: 'numeric'
        });
        const subtotal = Number(order.subtotal_server ?? (Number(order.total) - Number(order.shipping_server || 0)));
        const shipping = Number(order.shipping_server || 0);
        const grandTotal = Number(order.total);
        const fmt = (n: number) => `Rs. ${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

        // Total in words helper (Simplified for common totals)
        const numberToWords = (n: number) => {
            // For now, keep it simple or just return the numeric total with a prefix.
            return "Rupees " + n.toLocaleString('en-IN') + " Only"; 
        };

        // ── Build offscreen HTML invoice ───────────────────────────────────
        const container = document.createElement('div');
        container.id = "invoice-container";
        container.style.cssText = 'position:fixed;left:-9999px;top:0;width:800px;background:#fff;padding:0;margin:0;box-sizing:border-box;font-family:"Segoe UI", Roboto, Helvetica, Arial, sans-serif;';
        document.body.appendChild(container);

        const items = Array.isArray(order.items) ? order.items : [];
        const itemRows = items.map((item: any, i: number) => {
            const unit = Number(item.price || 0);
            const qty = Number(item.quantity || 0);
            return `
            <tr style="border-bottom: 1px solid #edf2f7;">
                <td style="padding: 12px; color: #718096; font-size: 11px; text-align: center; width: 40px;">${i + 1}</td>
                <td style="padding: 12px; text-align: left;">
                    <div style="font-weight: 700; color: #2d3748; font-size: 12px; line-height: 1.3;">${item.name || ''}</div>
                    <div style="font-size: 9px; color: #a0aec0; margin-top: 2px;">HSN/SAC: 6304 | Handcrafted Heritage</div>
                </td>
                <td style="padding: 12px; color: #4a5568; font-size: 11px; text-align: center; width: 60px; font-weight: 600;">${qty} Nos</td>
                <td style="padding: 12px; color: #4a5568; font-size: 11px; text-align: right; width: 100px; font-family: 'Courier New', Courier, monospace;">${fmt(unit)}</td>
                <td style="padding: 12px; color: #2D1B4E; font-size: 12px; font-weight: 800; text-align: right; width: 100px; font-family: 'Courier New', Courier, monospace;">${fmt(unit * qty)}</td>
            </tr>`;
        }).join('');

        const cityLine = [order.city, order.state, order.pincode ? `- ${order.pincode}` : ''].filter(Boolean).join(', ');

        container.innerHTML = `
        <div style="width: 800px; height: 1130px; display: flex; flex-direction: column; background: #fff; position: relative; color: #2d3748; box-sizing: border-box; overflow: hidden;">
            
            <div style="height: 6px; background: linear-gradient(90deg, #2D1B4E, #8E2A8B); width: 100%;"></div>

            <!-- HEADER -->
            <div style="padding: 30px 50px 25px; display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <img src="/uploads/2026/01/kottravai-logo-final.png" style="height: 65px; width: auto; margin-bottom: 8px;" />
                    <div style="font-size: 9px; text-transform: uppercase; letter-spacing: 5px; color: #8E2A8B; font-weight: 900;">Handcrafted Heritage</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 36px; font-weight: 950; color: #2D1B4E; letter-spacing: -1.2px; line-height: 0.9; margin-bottom: 12px;">TAX INVOICE</div>
                    <div style="background: #f7fafc; border: 1px solid #e2e8f0; padding: 6px 15px; display: inline-block; border-radius: 6px;">
                        <span style="font-size: 10px; font-weight: 800; color: #718096; text-transform: uppercase; margin-right: 8px;">Invoice No:</span>
                        <span style="font-size: 14px; font-weight: 900; color: #2D1B4E;">${invoiceId}</span>
                    </div>
                </div>
            </div>

            <!-- DETAILS GRID -->
            <div style="padding: 0 50px; display: flex; gap: 30px; margin-bottom: 25px;">
                <div style="flex: 1; border-left: 3px solid #8E2A8B; padding-left: 15px;">
                    <div style="font-size: 10px; font-weight: 900; color: #8E2A8B; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 1px;">Supplier Details</div>
                    <div style="font-size: 16px; font-weight: 900; color: #2D1B4E; margin-bottom: 4px;">Kottravai India</div>
                    <div style="font-size: 10.5px; color: #4a5568; line-height: 1.5;">
                        7/4, Heritage Street, Thoraipakkam<br/>
                        Chennai, Tamil Nadu – 600097<br/>
                        <span style="color: #718096; font-weight: 700;">GSTIN:</span> <span style="font-weight: 800; color: #2D1B4E;">33AABCK1234Z5</span><br/>
                        <span style="color: #718096; font-weight: 700;">State:</span> Tamil Nadu (33)
                    </div>
                </div>

                <div style="flex: 1; border-left: 3px solid #edf2f7; padding-left: 15px;">
                    <div style="font-size: 10px; font-weight: 900; color: #A0AEC0; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 1px;">Billed To</div>
                    <div style="font-size: 16px; font-weight: 900; color: #2D1B4E; margin-bottom: 4px;">${order.customerName || 'Customer'}</div>
                    <div style="font-size: 10.5px; color: #4a5568; line-height: 1.5;">
                        ${order.customerEmail || ''}<br/>
                        ${order.address || ''}<br/>
                        ${cityLine}<br/>
                        <span style="color: #718096; font-weight: 700;">Phone:</span> ${order.customerPhone || 'N/A'}
                    </div>
                </div>
            </div>

            <!-- META INFO BOX -->
            <div style="margin: 0 50px 25px; background: #2D1B4E; padding: 15px 25px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center;">
                <div style="text-align: left;">
                    <div style="font-size: 9px; color: rgba(255,255,255,0.6); font-weight: 800; text-transform: uppercase; margin-bottom: 2px;">Invoice Date</div>
                    <div style="font-size: 13px; font-weight: 800; color: #fff;">${dateStr}</div>
                </div>
                <div style="width: 1px; height: 25px; background: rgba(255,255,255,0.15);"></div>
                <div style="text-align: left;">
                    <div style="font-size: 9px; color: rgba(255,255,255,0.6); font-weight: 800; text-transform: uppercase; margin-bottom: 2px;">Payment Method</div>
                    <div style="font-size: 13px; font-weight: 800; color: #fff;">Prepaid (Razorpay)</div>
                </div>
                <div style="width: 1px; height: 25px; background: rgba(255,255,255,0.15);"></div>
                <div style="text-align: left;">
                    <div style="font-size: 9px; color: rgba(255,255,255,0.6); font-weight: 800; text-transform: uppercase; margin-bottom: 2px;">Status</div>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <div style="width: 6px; height: 6px; border-radius: 50%; background: #48bb78;"></div>
                        <div style="font-size: 12px; font-weight: 900; color: #fff; text-transform: uppercase;">PAID</div>
                    </div>
                </div>
            </div>

            <!-- TABLE CONTENT -->
            <div style="padding: 0 50px; flex: 1;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="border-bottom: 2px solid #2D1B4E;">
                            <th style="padding: 10px; color: #2D1B4E; font-size: 10px; font-weight: 900; text-transform: uppercase; text-align: center; width: 40px;">No.</th>
                            <th style="padding: 10px; color: #2D1B4E; font-size: 10px; font-weight: 900; text-transform: uppercase; text-align: left;">Item Description</th>
                            <th style="padding: 10px; color: #2D1B4E; font-size: 10px; font-weight: 900; text-transform: uppercase; text-align: center; width: 60px;">Qty</th>
                            <th style="padding: 10px; color: #2D1B4E; font-size: 10px; font-weight: 900; text-transform: uppercase; text-align: right; width: 110px;">Rate</th>
                            <th style="padding: 10px; color: #2D1B4E; font-size: 10px; font-weight: 900; text-transform: uppercase; text-align: right; width: 110px;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemRows}
                        ${items.length < 5 ? `<tr style="height: 100px;"><td colspan="5"></td></tr>` : ''}
                    </tbody>
                </table>
            </div>

            <!-- FOOTER WRAPPER -->
            <div style="padding: 25px 50px 40px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px;">
                    <div style="max-width: 320px;">
                        <div style="margin-bottom: 15px;">
                            <div style="font-size: 9px; font-weight: 900; color: #A0AEC0; text-transform: uppercase; margin-bottom: 4px;">Amount in Words</div>
                            <div style="font-size: 12px; font-weight: 800; color: #2D1B4E;">${numberToWords(grandTotal)}</div>
                        </div>
                        
                        <div style="background: #fdf2f8; border-radius: 10px; padding: 12px; border: 1px solid #f9a8d4;">
                            <div style="font-size: 9px; font-weight: 900; color: #8E2A8B; text-transform: uppercase; margin-bottom: 4px;">Terms & Conditions</div>
                            <div style="font-size: 9px; color: #8E2A8B; line-height: 1.5; font-weight: 500;">
                                • Prices include GST (IGST) at 12%<br/>
                                • Handcrafted products - unique subtle variations<br/>
                                • Verification needed within 48h for claims<br/>
                                • Digital copy - no physical signature required
                            </div>
                        </div>
                    </div>

                    <div style="width: 280px; background: #fff; border: 2px solid #2D1B4E; border-radius: 12px; overflow: hidden;">
                        <div style="padding: 12px 15px; display: flex; justify-content: space-between; border-bottom: 1px solid #edf2f7;">
                            <span style="font-size: 12px; font-weight: 700; color: #718096;">Subtotal</span>
                            <span style="font-size: 12px; font-weight: 800; color: #2D1B4E;">${fmt(subtotal)}</span>
                        </div>
                        <div style="padding: 12px 15px; display: flex; justify-content: space-between; background: #f7fafc;">
                            <span style="font-size: 12px; font-weight: 700; color: #718096;">Shipping</span>
                            <span style="font-size: 12px; font-weight: 800; color: #2D1B4E;">${fmt(shipping)}</span>
                        </div>
                        <div style="padding: 15px; display: flex; justify-content: space-between; background: #2D1B4E; color: #fff;">
                            <span style="font-size: 14px; font-weight: 900; text-transform: uppercase;">Grand Total</span>
                            <span style="font-size: 18px; font-weight: 950;">${fmt(grandTotal)}</span>
                        </div>
                    </div>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #edf2f7; padding-top: 25px;">
                    <div style="font-size: 9px; color: #A0AEC0; font-weight: 600;">Generated: ${new Date().toLocaleString()}</div>
                    <div style="text-align: center;">
                        <div style="font-size: 11px; font-weight: 900; color: #2D1B4E; margin-bottom: 35px; text-transform: uppercase;">for Kottravai India</div>
                        <div style="width: 150px; height: 1.5px; background: #2D1B4E; margin: 0 auto 8px;"></div>
                        <div style="font-size: 10px; font-weight: 800; color: #718096; text-transform: uppercase;">Authorized Signatory</div>
                    </div>
                </div>
            </div>

            <div style="background: #f7fafc; padding: 20px 50px; border-top: 1px solid #edf2f7; display: flex; justify-content: space-between; align-items: center; margin-top: auto;">
                <div style="font-size: 9px; font-weight: 700; color: #718096; text-transform: uppercase;">+91 99999 88888 &nbsp;|&nbsp; support@kottravai.in &nbsp;|&nbsp; kottravai.in</div>
                <div style="font-size: 11px; font-weight: 950; color: #2D1B4E; text-transform: uppercase; letter-spacing: 2px;">KOTTRAVAI</div>
            </div>
        </div>`;

        toast.loading('Generating industry-grade tax invoice...', { id: 'inv' });
        try {
            const canvas = await html2canvas(container, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });
            document.body.removeChild(container);

            const imgData = canvas.toDataURL('image/png', 1.0);
            const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
            const pdfW = pdf.internal.pageSize.getWidth();
            const pdfH = (canvas.height * pdfW) / canvas.width;

            if (pdfH <= 297) {
                pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH, undefined, 'FAST');
            } else {
                let y = 0;
                const pageH = 297;
                while (y < pdfH) {
                    if (y > 0) pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, -y, pdfW, pdfH, undefined, 'FAST');
                    y += pageH;
                }
            }

            const safeName = (order.customerName || 'Customer').replace(/\s+/g, '_');
            pdf.save(`Kottravai_Tax_Invoice_${invoiceId}_${safeName}.pdf`);
            toast.success('Professional tax invoice generated!', { id: 'inv' });
        } catch (err) {
            if (document.getElementById('invoice-container')) document.body.removeChild(container);
            toast.error('Invoice generation failed', { id: 'inv' });
            console.error(err);
        }
    };




    const recentActivity = [
        { id: 1, type: 'order', message: 'New order received from John Doe', time: '5 mins ago', status: 'success' },
        { id: 2, type: 'stock', message: 'Product "Bento Box" is low on stock', time: '12 mins ago', status: 'warning' },
        { id: 3, type: 'review', message: 'New 5-star review on "Ceramic Plate"', time: '1 hour ago', status: 'info' },
        { id: 4, type: 'news', message: 'News article "Safety First" published', time: '3 hours ago', status: 'success' },
    ];

    const topProducts = products.slice(0, 4).map(p => ({
        name: p.name,
        sales: Math.floor(Math.random() * 500) + 100,
        growth: Math.floor(Math.random() * 20) + 5,
        image: p.image
    }));


    const filteredReviews = getReviewsByPage(reviewPage);

    // Calculate dynamic stats
    const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = orders.length;

    // Calculate growth (comparing this month vs last month)
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const thisMonthOrders = orders.filter(o => new Date(o.date) >= thisMonthStart);
    const lastMonthOrders = orders.filter(o => {
        const d = new Date(o.date);
        return d >= lastMonthStart && d < thisMonthStart;
    });

    const thisMonthSales = thisMonthOrders.reduce((sum, order) => sum + order.total, 0);
    const lastMonthSales = lastMonthOrders.reduce((sum, order) => sum + order.total, 0);

    const salesGrowth = lastMonthSales === 0 ? (thisMonthSales > 0 ? 12 : 0) : ((thisMonthSales - lastMonthSales) / lastMonthSales) * 100;
    const ordersGrowth = lastMonthOrders.length === 0 ? (thisMonthOrders.length > 0 ? 5 : 0) : ((thisMonthOrders.length - lastMonthOrders.length) / lastMonthOrders.length) * 100;

    // Extract unique customers from orders
    const customers = orders.reduce((acc: any[], order) => {
        const existing = acc.find(c => c.email === order.customerEmail);
        if (existing) {
            existing.totalSpent += order.total;
            existing.orderCount += 1;
            if (new Date(order.date) > new Date(existing.lastOrder)) {
                existing.lastOrder = order.date;
            }
        } else {
            acc.push({
                name: order.customerName,
                email: order.customerEmail,
                phone: order.customerPhone,
                totalSpent: order.total,
                orderCount: 1,
                lastOrder: order.date
            });
        }
        return acc;
    }, []);


    // Helper: get all descendant slugs for a given category slug (recursive)
    const getDescendantSlugs = (slug: string): string[] => {
        const children = categories.filter(c => c.parent === slug);
        return [slug, ...children.flatMap(c => getDescendantSlugs(c.slug))];
    };

    // Filter products by category slug (includes all nested sub-categories)
    const filteredProducts = products.filter(p => {
        const matchesCategory = selectedCategory === 'all' || (p.categorySlug && getDescendantSlugs(selectedCategory).includes(p.categorySlug));
        const matchesStatus = statusFilter === 'all' || (statusFilter === 'live' ? p.isLive !== false : p.isLive === false);
        const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesStatus && matchesSearch;
    });

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        category: categories[0]?.slug || '', // Use slug for value
        description: '',
        shortDescription: '',
        keyFeatures: '',
        specifications: '',

        reviews: '',
        isBestSeller: false,
        isGiftBundleItem: false,
        isLive: true,
        isCustomRequest: false,
        defaultFormFields: [
            { id: 'name', label: 'Name to Print', placeholder: 'Enter the name exactly as you want', type: 'text' as const, required: true, isDefault: true },
            { id: 'email', label: 'Email Address', placeholder: 'Enter your email address', type: 'email' as const, required: true, isDefault: true },
            { id: 'phone', label: 'Phone Number', placeholder: 'Enter your phone number', type: 'tel' as const, required: true, isDefault: true },
            { id: 'image', label: 'Reference Image', placeholder: 'Upload reference image (optional)', type: 'file' as const, required: false, isDefault: true }
        ],
        customFormConfig: [] as { id: string; label: string; type: 'text' | 'textarea' | 'number'; placeholder?: string; required?: boolean }[],
        variants: [] as { weight: string; price: number; images: string[] }[],
        // Affiliate fields
        is_affiliate_eligible: true,
        affiliate_commission_rate: '10',
        affiliate_payout_type: 'percentage' as 'percentage' | 'fixed',
        affiliate_fixed_amount: '0',
        min_affiliate_level: 'Kottravai Ambassador'
    });

    const [mainImage, setMainImage] = useState<string>('');
    const [mainImageFile, setMainImageFile] = useState<File | null>(null);
    const [otherImages, setOtherImages] = useState<string[]>([]);
    const [otherImageFiles, setOtherImageFiles] = useState<File[]>([]);
    const [newsImageFile, setNewsImageFile] = useState<File | null>(null);
    const [reviewImageFile, setReviewImageFile] = useState<File | null>(null);
    const [partnerLogoFile, setPartnerLogoFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);



    // Base64 helper (reverted from storage upload)
    const convertToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    // Generic Upload Helper Proxy (Bypasses Storage RLS)
    const uploadToSupabase = async (file: File, folder: string): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);

        const adminSecret = sessionStorage.getItem('kottravai_admin_token') || 'admin123';
        
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL || '/api'}/storage/upload`, formData, {
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    'X-Admin-Secret': adminSecret
                }
            });

            return response.data.publicUrl;
        } catch (error: any) {
            console.error('❌ Upload Proxy Failed:', error);
            const detail = error.response?.data?.error;
            const message = typeof detail === 'string' ? detail : (detail ? JSON.stringify(detail) : error.message || 'Failed to upload image via proxy');
            throw new Error(message);
        }
    };

    // File Handlers
    const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setMainImageFile(file);
            const base64 = await convertToBase64(file);
            setMainImage(base64); // For preview only
        }
    };

    const handleNewsImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setNewsImageFile(file);
            const base64 = await convertToBase64(file);
            setNewsForm({ ...newsForm, image: base64 }); // For preview only
        }
    };

    const handleOtherImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const fileList = Array.from(files);
            setOtherImageFiles(prev => [...prev, ...fileList]);

            for (const file of fileList) {
                const base64 = await convertToBase64(file);
                setOtherImages(prev => [...prev, base64]); // For preview only
            }
        }
    };

    const handleDeleteProduct = (productId: string, productName: string) => {
        if (window.confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
            deleteProduct(productId);
            toast.success('Product deleted successfully');
        }
    };

    const handleEdit = (product: any) => {
        setEditingId(product.id);

        // Find slug from category name for proper select value
        const catObj = categories.find(c => c.name === product.category);
        const catSlug = catObj ? catObj.slug : categories[0].slug;

        setFormData({
            name: product.name,
            price: product.price.toString(),
            category: catSlug,
            description: product.description || '',
            shortDescription: product.shortDescription || '', // assuming property exists or optional
            keyFeatures: product.keyFeatures ? product.keyFeatures.join('\n') : '',
            specifications: product.features ? product.features.join('\n') : '',

            reviews: '',
            isBestSeller: product.isBestSeller || false,
            isGiftBundleItem: product.isGiftBundleItem || false,
            isLive: product.isLive !== undefined ? product.isLive : true,
            isCustomRequest: product.isCustomRequest || false,
            defaultFormFields: product.defaultFormFields || [
                { id: 'name', label: 'Name to Print', placeholder: 'Enter the name exactly as you want', type: 'text' as const, required: true, isDefault: true },
                { id: 'email', label: 'Email Address', placeholder: 'Enter your email address', type: 'email' as const, required: true, isDefault: true },
                { id: 'phone', label: 'Phone Number', placeholder: 'Enter your phone number', type: 'tel' as const, required: true, isDefault: true },
                { id: 'image', label: 'Reference Image', placeholder: 'Upload reference image (optional)', type: 'file' as const, required: false, isDefault: true }
            ],
            customFormConfig: product.customFormConfig || [],
            variants: product.variants || [],
            // Affiliate fields mapping
            is_affiliate_eligible: product.is_affiliate_eligible !== undefined ? product.is_affiliate_eligible : true,
            affiliate_commission_rate: (product.affiliate_commission_rate || '10').toString(),
            affiliate_payout_type: product.affiliate_payout_type || 'percentage',
            affiliate_fixed_amount: (product.affiliate_fixed_amount || '0').toString(),
            min_affiliate_level: product.min_affiliate_level || 'Kottravai Ambassador'
        });
        setMainImage(product.image);
        setOtherImages(product.images || []);
        setView('add');
    };

    const handleQuickEditInit = (product: any) => {
        setQuickEditId(product.id);
        setQuickEditForm({
            name: product.name,
            price: product.price.toString(),
            isBestSeller: product.isBestSeller || false,
            isGiftBundleItem: product.isGiftBundleItem || false,
            isLive: product.isLive !== undefined ? product.isLive : true
        });
    };

    const handleQuickUpdate = async (product: any) => {
        setIsUploading(true);
        const updateToast = toast.loading("Performing quick update...");
        try {
            const updatedProduct = {
                ...product,
                name: quickEditForm.name,
                price: parseFloat(quickEditForm.price),
                isBestSeller: quickEditForm.isBestSeller,
                isGiftBundleItem: quickEditForm.isGiftBundleItem,
                isLive: quickEditForm.isLive,
                slug: quickEditForm.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
            };

            await updateProduct(updatedProduct);
            toast.success("Product updated!", { id: updateToast });
            setQuickEditId(null);
            fetchProducts(true);
        } catch (error) {
            toast.error("Failed to update product", { id: updateToast });
        } finally {
            setIsUploading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            price: '',
            category: categories[0]?.slug || '',
            description: '',
            shortDescription: '',
            keyFeatures: '',
            specifications: '',

            reviews: '',
            isBestSeller: false,
            isGiftBundleItem: false,
            isLive: true,
            isCustomRequest: false,
            defaultFormFields: [
                { id: 'name', label: 'Name to Print', placeholder: 'Enter the name exactly as you want', type: 'text' as const, required: true, isDefault: true },
                { id: 'email', label: 'Email Address', placeholder: 'Enter your email address', type: 'email' as const, required: true, isDefault: true },
                { id: 'phone', label: 'Phone Number', placeholder: 'Enter your phone number', type: 'tel' as const, required: true, isDefault: true },
                { id: 'image', label: 'Reference Image', placeholder: 'Upload reference image (optional)', type: 'file' as const, required: false, isDefault: true }
            ],
            customFormConfig: [],
            variants: [],
            is_affiliate_eligible: true,
            affiliate_commission_rate: '10',
            affiliate_payout_type: 'percentage',
            affiliate_fixed_amount: '0',
            min_affiliate_level: 'Kottravai Ambassador'
        });
        setMainImage('');
        setMainImageFile(null);
        setOtherImages([]);
        setOtherImageFiles([]);
        setEditingId(null);
        setIsUploading(false);
        setStatusFilter('all');
        setSearchQuery('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Validation
        if (!formData.name.trim()) return toast.error("Product Name is required");
        if (!formData.isCustomRequest && (!formData.price || isNaN(parseFloat(formData.price)))) return toast.error("Please enter a valid price");
        if (!formData.category) return toast.error("Please select a category");
        if (!mainImage && !mainImageFile) return toast.error("Main Product Image is required");

        setIsUploading(true);
        const uploadToast = toast.loading(editingId ? "Updating product..." : "Creating product...");

        try {
            // 2. Upload Images to Supabase if they are new files
            let uploadedMainUrl = mainImage;
            if (mainImageFile) {
                uploadedMainUrl = await uploadToSupabase(mainImageFile, 'products');
            }

            const uploadedOtherUrls = await Promise.all(
                otherImages.map(async (img, idx) => {
                    // Check if this index has a corresponding file in otherImageFiles
                    // (Matches by index if otherImageFiles were added in order)
                    // If it's already a URL (not base64), keep it
                    if (img.startsWith('http')) return img;

                    // Find the matching file index. Note: This simple logic assumes 
                    // otherImageFiles matches 1:1 with base64 strings in otherImages
                    // that don't start with http.
                    const fileIndex = otherImages.slice(0, idx).filter(ui => !ui.startsWith('http')).length;
                    if (otherImageFiles[fileIndex]) {
                        return await uploadToSupabase(otherImageFiles[fileIndex], 'gallery');
                    }
                    return img;
                })
            );

            // Find category name from slug
            const categoryObj = categories.find(c => c.slug === formData.category);
            const categoryName = categoryObj ? categoryObj.name : 'Uncategorized';

            // Find existing product to preserve reviews if editing
            const existingProduct = products.find(p => p.id === editingId);
            const existingReviews = existingProduct?.reviews || [];

            const productData = {
                id: editingId || Date.now().toString(),
                name: formData.name,
                price: formData.isCustomRequest ? 0 : parseFloat(formData.price),
                category: categoryName,
                categorySlug: formData.category,
                slug: formData.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
                image: uploadedMainUrl,
                images: uploadedOtherUrls,
                shortDescription: formData.shortDescription,
                description: formData.description,
                keyFeatures: formData.keyFeatures.split('\n').filter(f => f.trim() !== ''),
                features: formData.specifications.split('\n').filter(f => f.trim() !== ''),
                reviews: existingReviews,
                isBestSeller: formData.isBestSeller,
                isGiftBundleItem: formData.isGiftBundleItem,
                isLive: formData.isLive,
                isCustomRequest: formData.isCustomRequest,
                defaultFormFields: formData.defaultFormFields,
                customFormConfig: formData.customFormConfig,
                variants: formData.variants,
                // Affiliate fields
                is_affiliate_eligible: formData.is_affiliate_eligible,
                affiliate_commission_rate: parseFloat(formData.affiliate_commission_rate) || 0,
                affiliate_payout_type: formData.affiliate_payout_type,
                affiliate_fixed_amount: parseInt(formData.affiliate_fixed_amount) || 0,
                min_affiliate_level: formData.min_affiliate_level
            };

            if (editingId) {
                await updateProduct(productData);
                toast.success('Product Updated Successfully!', { id: uploadToast });
            } else {
                await addProduct(productData);
                toast.success('Product Added Successfully!', { id: uploadToast });
            }

            await fetchProducts(true);
            setView('list');
            resetForm();

        } catch (error: any) {
            console.error("❌ Failed to save product:", error);
            
            // Extract the most meaningful error message
            let errorMessage = "Unknown error occurred";
            
            if (error.response?.data?.error) {
                // Backend sent a specific error message
                errorMessage = typeof error.response.data.error === 'string' 
                    ? error.response.data.error 
                    : JSON.stringify(error.response.data.error);
            } else if (error.message) {
                // Axios or network error
                errorMessage = error.message;
            }
            
            toast.error(`Failed to save product: ${errorMessage}`, { id: uploadToast });
        } finally {
            setIsUploading(false);
        }
    }

    const handleAddVideo = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newVideo.title || !newVideo.url) return toast.error("Please fill in both fields");

        // Simple embed conversion if user pastes full URL
        let embedUrl = newVideo.url;
        if (newVideo.url.includes('watch?v=')) {
            embedUrl = newVideo.url.replace('watch?v=', 'embed/');
        } else if (newVideo.url.includes('youtu.be/')) {
            embedUrl = newVideo.url.replace('youtu.be/', 'www.youtube.com/embed/');
        }

        if (editingVideoId) {
            updateVideo({ id: editingVideoId, title: newVideo.title, url: embedUrl });
            setEditingVideoId(null);
            toast.success("Video updated successfully");
        } else {
            addVideo({ title: newVideo.title, url: embedUrl });
            toast.success("Video added successfully");
        }

        setNewVideo({ title: '', url: '' });
    };

    const handleEditVideo = (video: any) => {
        setEditingVideoId(video.id);
        setNewVideo({ title: video.title, url: video.url });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelVideoEdit = () => {
        setEditingVideoId(null);
        setNewVideo({ title: '', url: '' });
    };

    const handleAddNews = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newsForm.title || !newsForm.category || !newsForm.date || !newsForm.link) return toast.error("Please fill all fields");

        setIsUploading(true);
        const uploadToast = toast.loading("Saving news item...");
        try {
            let uploadedImageUrl = newsForm.image;
            if (newsImageFile) {
                uploadedImageUrl = await uploadToSupabase(newsImageFile, 'news');
            }

            const newsData = { ...newsForm, image: uploadedImageUrl };

            if (editingNewsId) {
                updateNewsItem({ id: editingNewsId, ...newsData });
                setEditingNewsId(null);
                toast.success("News updated successfully", { id: uploadToast });
            } else {
                addNewsItem(newsData);
                toast.success("News added successfully", { id: uploadToast });
            }
            setNewsForm({ title: '', category: '', date: '', image: '', link: '' });
            setNewsImageFile(null);
        } catch (error: any) {
            toast.error("Failed to save news item", { id: uploadToast });
        } finally {
            setIsUploading(false);
        }
    };

    const handleEditNews = (news: any) => {
        setEditingNewsId(news.id);
        setNewsForm({
            title: news.title,
            category: news.category,
            date: news.date,
            image: news.image,
            link: news.link
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelNewsEdit = () => {
        setEditingNewsId(null);
        setNewsForm({ title: '', category: '', date: '', image: '', link: '' });
    };

    const handleAddReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reviewForm.name || !reviewForm.content) return toast.error("All fields are required");

        setIsUploading(true);
        const uploadToast = toast.loading("Saving review...");
        try {
            let uploadedImageUrl = reviewForm.image;
            if (reviewImageFile) {
                uploadedImageUrl = await uploadToSupabase(reviewImageFile, 'reviews');
            }

            const reviewData = {
                ...reviewForm,
                image: uploadedImageUrl,
                page: reviewPage
            };

            if (editingReviewId) {
                updateReview({ id: editingReviewId, ...reviewData });
                setEditingReviewId(null);
                toast.success("Review updated successfully", { id: uploadToast });
            } else {
                addReview(reviewData);
                toast.success("Review added successfully", { id: uploadToast });
            }
            setReviewForm({ name: '', role: '', content: '', image: '', rating: 5 });
            setReviewImageFile(null);
        } catch (error: any) {
            toast.error("Failed to save review", { id: uploadToast });
        } finally {
            setIsUploading(false);
        }
    };

    const handleEditReview = (review: any) => {
        setEditingReviewId(review.id);
        setReviewForm({
            name: review.name,
            role: review.role,
            content: review.content,
            image: review.image,
            rating: review.rating || 5
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelReviewEdit = () => {
        setEditingReviewId(null);
        setReviewForm({ name: '', role: '', content: '', image: '', rating: 5 });
    };

    const handleReviewImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setReviewImageFile(file);
            const base64 = await convertToBase64(file);
            setReviewForm({ ...reviewForm, image: base64 });
        }
    };

    const handleAddPartner = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!partnerForm.name) return toast.error("Partner Name is required");

        setIsUploading(true);
        const uploadToast = toast.loading("Saving partner...");
        try {
            let uploadedLogoUrl = partnerForm.logo;
            if (partnerLogoFile) {
                uploadedLogoUrl = await uploadToSupabase(partnerLogoFile, 'partners');
            }

            const partnerData = { ...partnerForm, logo: uploadedLogoUrl };

            if (editingPartnerId) {
                updatePartner({ id: editingPartnerId, ...partnerData });
                setEditingPartnerId(null);
                toast.success("Partner updated successfully", { id: uploadToast });
            } else {
                addPartner(partnerData);
                toast.success("Partner added successfully", { id: uploadToast });
            }
            setPartnerForm({ name: '', logo: '' });
            setPartnerLogoFile(null);
        } catch (error: any) {
            toast.error("Failed to save partner", { id: uploadToast });
        } finally {
            setIsUploading(false);
        }
    };

    const handleEditPartner = (partner: any) => {
        setEditingPartnerId(partner.id);
        setPartnerForm({
            name: partner.name,
            logo: partner.logo || ''
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelPartnerEdit = () => {
        setEditingPartnerId(null);
        setPartnerForm({ name: '', logo: '' });
    };

    const handlePartnerLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPartnerLogoFile(file);
            const base64 = await convertToBase64(file);
            setPartnerForm({ ...partnerForm, logo: base64 });
        }
    };

    const removeOtherImage = (index: number) => {
        const isFile = !otherImages[index].startsWith('http');
        if (isFile) {
            // Find which file in otherImageFiles corresponds to this index
            const fileIndex = otherImages.slice(0, index).filter(img => !img.startsWith('http')).length;
            setOtherImageFiles(prev => prev.filter((_, i) => i !== fileIndex));
        }
        setOtherImages(prev => prev.filter((_, i) => i !== index));
    };

    if (isAdminAuthenticated === null) return null; // Prevent flicker

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans">
            {/* Sidebar */}
            <aside className="w-72 bg-[#2D1B4E] text-white flex-shrink-0 hidden lg:flex flex-col border-r border-white/5 shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#8E2A8B] via-purple-400 to-[#8E2A8B]"></div>

                <div className="p-8 pb-10">
                    <div className="flex flex-col items-center">
                        <div className="relative group cursor-pointer">
                            <div className="absolute -inset-1 bg-gradient-to-r from-[#8E2A8B] to-purple-600 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                            <img src="/admin-logo.png" alt="Kottravai" className="relative w-48 h-auto object-contain transition-all duration-500 group-hover:scale-105 group-hover:brightness-0 group-hover:invert" />
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                            <span className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em]">System Core Active</span>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-10 overflow-y-auto no-scrollbar pb-10">
                    {/* Main Section */}
                    <div className="space-y-2">
                        <p className="px-4 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Central Hub</p>
                        <button
                            onClick={() => { setView('dashboard'); resetForm(); setSelectedCategory('all'); fetchProducts(true); }}
                            className={`w-full text-left px-5 py-3.5 rounded-2xl transition-all duration-300 font-bold flex items-center gap-4 group ${view === 'dashboard' ? 'sidebar-item-active' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                        >
                            <div className={`p-2 rounded-xl transition-colors ${view === 'dashboard' ? 'bg-white/20' : 'bg-gray-800 group-hover:bg-gray-700'}`}>
                                <LayoutDashboard size={20} />
                            </div>
                            <span className="text-sm">Control Tower</span>
                        </button>
                    </div>

                    {/* Management Section */}
                    <div className="space-y-4">
                        <p className="px-4 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Commerce Lab</p>
                        <div className="space-y-2">
                            {[
                                { view: 'list', icon: Package, label: 'Inventory', active: selectedCategory === 'all' && view === 'list' },
                                { view: 'stocks', icon: Activity, label: 'Stock Levels', active: view === 'stocks' },
                                { view: 'orders', icon: ShoppingBag, label: 'Order Streams', active: view === 'orders' },
                                { view: 'users', icon: Users, label: 'User Insights', active: view === 'users' }
                            ].map((item, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        if (item.view === 'list') {
                                            setSelectedCategory('all');
                                            fetchProducts(true);
                                        }
                                        if (item.view === 'orders') {
                                            fetchAllOrders(true);
                                        }
                                        setView(item.view as any);
                                        resetForm();
                                    }}
                                    className={`w-full text-left px-5 py-3 rounded-2xl transition-all duration-300 font-bold flex items-center justify-between group ${item.active ? 'sidebar-item-active' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-xl transition-colors ${item.active ? 'bg-white/20' : 'bg-gray-800 group-hover:bg-gray-700'}`}>
                                            <item.icon size={18} />
                                        </div>
                                        <span className="text-sm">{item.label}</span>
                                    </div>
                                    {item.active && <div className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_white]"></div>}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* WhatsApp Tools */}
                    <div className="space-y-4">
                        <p className="px-4 text-[10px] font-black text-[#25D366] uppercase tracking-[0.2em]">WhatsApp Tools</p>
                        <div className="space-y-2">
                            <button
                                onClick={() => { setView('whatsapp-helper'); resetForm(); }}
                                className={`w-full text-left px-5 py-3 rounded-2xl transition-all duration-300 font-bold flex items-center justify-between group ${view === 'whatsapp-helper' ? 'sidebar-item-active' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-xl transition-colors ${view === 'whatsapp-helper' ? 'bg-[#25D366]/20' : 'bg-gray-800 group-hover:bg-gray-700'}`}>
                                        <MessageCircle size={18} color="#25D366" />
                                    </div>
                                    <span className="text-sm">Catalog Assistant</span>
                                </div>
                                {view === 'whatsapp-helper' && <div className="h-1.5 w-1.5 rounded-full bg-[#25D366] shadow-[0_0_8px_#25D366]"></div>}
                            </button>
                        </div>
                    </div>

                    {/* Affiliate Network */}
                    <div className="space-y-4">
                        <p className="px-4 text-[10px] font-black text-[#8E2A8B] uppercase tracking-[0.2em]">Affiliate Network</p>
                        <div className="space-y-2">
                            <button
                                onClick={() => { setView('affiliate-dashboard'); resetForm(); }}
                                className={`w-full text-left px-5 py-3 rounded-2xl transition-all duration-300 font-bold flex items-center justify-between group ${view === 'affiliate-dashboard' ? 'sidebar-item-active' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-xl transition-colors ${view === 'affiliate-dashboard' ? 'bg-[#8E2A8B]/20' : 'bg-gray-800 group-hover:bg-gray-700'}`}>
                                        <Activity size={18} className={view === 'affiliate-dashboard' ? 'text-[#8E2A8B]' : ''}/>
                                    </div>
                                    <span className="text-sm">Affiliate Performance</span>
                                </div>
                                {view === 'affiliate-dashboard' && <div className="h-1.5 w-1.5 rounded-full bg-[#8E2A8B] shadow-[0_0_8px_#8E2A8B]"></div>}
                            </button>
                            <button
                                onClick={() => { setView('affiliates'); resetForm(); }}
                                className={`w-full text-left px-5 py-3 rounded-2xl transition-all duration-300 font-bold flex items-center justify-between group ${view === 'affiliates' ? 'sidebar-item-active' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-xl transition-colors ${view === 'affiliates' ? 'bg-[#8E2A8B]/20' : 'bg-gray-800 group-hover:bg-gray-700'}`}>
                                        <UserCheck size={18} className={view === 'affiliates' ? 'text-[#8E2A8B]' : ''}/>
                                    </div>
                                    <span className="text-sm">Affiliate Applications</span>
                                </div>
                                {view === 'affiliates' && <div className="h-1.5 w-1.5 rounded-full bg-[#8E2A8B] shadow-[0_0_8px_#8E2A8B]"></div>}
                            </button>
                            <button
                                onClick={() => { setView('affiliate-partners'); resetForm(); }}
                                className={`w-full text-left px-5 py-3 rounded-2xl transition-all duration-300 font-bold flex items-center justify-between group ${view === 'affiliate-partners' ? 'sidebar-item-active' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-xl transition-colors ${view === 'affiliate-partners' ? 'bg-[#8E2A8B]/20' : 'bg-gray-800 group-hover:bg-gray-700'}`}>
                                        <Users size={18} className={view === 'affiliate-partners' ? 'text-[#8E2A8B]' : ''}/>
                                    </div>
                                    <span className="text-sm">Affiliates</span>
                                </div>
                                {view === 'affiliate-partners' && <div className="h-1.5 w-1.5 rounded-full bg-[#8E2A8B] shadow-[0_0_8px_#8E2A8B]"></div>}
                            </button>
                            <button
                                onClick={() => { setView('affiliate-withdrawals'); resetForm(); }}
                                className={`w-full text-left px-5 py-3 rounded-2xl transition-all duration-300 font-bold flex items-center justify-between group ${view === 'affiliate-withdrawals' ? 'sidebar-item-active' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-xl transition-colors ${view === 'affiliate-withdrawals' ? 'bg-[#8E2A8B]/20' : 'bg-gray-800 group-hover:bg-gray-700'}`}>
                                        <DollarSign size={18} className={view === 'affiliate-withdrawals' ? 'text-[#8E2A8B]' : ''}/>
                                    </div>
                                    <span className="text-sm">Withdrawal Logs</span>
                                </div>
                                {view === 'affiliate-withdrawals' && <div className="h-1.5 w-1.5 rounded-full bg-[#8E2A8B] shadow-[0_0_8px_#8E2A8B]"></div>}
                            </button>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="space-y-4">
                        <p className="px-4 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Brand Experience</p>
                        <div className="space-y-2">
                            {[
                                { view: 'reviews', icon: MessageSquareQuote, label: 'Feedback' },
                                { view: 'news', icon: Newspaper, label: 'Newsroom' },
                                { view: 'videos', icon: Video, label: 'Media Hub' },
                                { view: 'partners', icon: Handshake, label: 'Alliances' },
                                { view: 'alliance-apps', icon: Search, label: 'Alliance Catalog' }
                            ].map((item, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => { setView(item.view as any); resetForm(); }}
                                    className={`w-full text-left px-5 py-3 rounded-2xl transition-all duration-300 font-bold flex items-center justify-between group ${view === item.view ? 'sidebar-item-active' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-xl transition-colors ${view === item.view ? 'bg-white/20' : 'bg-gray-800 group-hover:bg-gray-700'}`}>
                                            <item.icon size={18} />
                                        </div>
                                        <span className="text-sm">{item.label}</span>
                                    </div>
                                    {view === item.view && <div className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_white]"></div>}
                                </button>
                            ))}
                        </div>
                    </div>
                </nav>

                <div className="p-6 mt-auto">
                    <div className="bg-gradient-to-br from-[#8E2A8B]/20 to-[#2D1B4E] rounded-2xl p-5 border border-[#8E2A8B]/30 shadow-inner">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="h-10 w-10 rounded-full bg-[#8E2A8B] flex items-center justify-center font-black text-white shadow-lg">AD</div>
                            <div>
                                <p className="text-xs font-black text-white">Super Admin</p>
                                <p className="text-[10px] text-gray-400">Master Level Access</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-900/50 text-rose-400 text-xs font-black hover:bg-rose-500 hover:text-white transition-all duration-300"
                        >
                            <LogOut size={14} />
                            CORE DISCONNECT
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-gray-50/50">
                <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-10 py-5 flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-8 flex-1">
                        <h2 className="text-2xl font-black text-[#2D1B4E] whitespace-nowrap admin-gradient-text">
                            {view === 'dashboard' ? 'Overview' : view === 'videos' ? 'Video Lab' : view === 'news' ? 'Press Hub' : view === 'reviews' ? 'Feedback Lab' : view === 'stocks' ? 'Inventory' : view === 'orders' ? 'Order Stream' : view === 'users' ? 'Monitoring' : view === 'partners' ? 'Alliances' : view === 'affiliates' ? 'Affiliate Program' : view === 'affiliate-partners' ? 'Affiliate Partners' : view === 'affiliate-dashboard' ? 'Affiliate Performance' : view === 'alliance-apps' ? 'Alliance Catalog' : view === 'add' ? (editingId ? 'Refine Product' : 'Construct Product') : (selectedCategory === 'all' ? 'Inventory Catalog' : categories.find(c => c.slug === selectedCategory)?.name || selectedCategory)}
                        </h2>

                        {/* Search Bar */}
                        <div className="hidden md:flex items-center flex-1 max-w-md relative group">
                            <Search className="absolute left-4 text-gray-400 group-focus-within:text-[#8E2A8B] transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Search everything..."
                                className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-4 py-3 text-sm font-medium focus:ring-2 focus:ring-[#8E2A8B]/10 transition-all outline-none"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-5">
                        <div className="flex items-center gap-2 border-r border-gray-100 pr-5">
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="relative p-2.5 rounded-xl bg-gray-50 text-gray-500 hover:bg-[#8E2A8B]/5 hover:text-[#8E2A8B] transition-all group"
                            >
                                <Bell size={20} />
                                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-rose-500 border-2 border-white"></span>

                                {showNotifications && (
                                    <div className="absolute top-full right-0 mt-4 w-80 glass-card rounded-2xl p-4 shadow-2xl z-50 animate-in slide-in-from-top-2 duration-300">
                                        <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-50">
                                            <h4 className="font-black text-[#2D1B4E] text-xs uppercase tracking-widest">Alerts Flow</h4>
                                            <span className="text-[10px] text-[#8E2A8B] font-bold">4 New</span>
                                        </div>
                                        <div className="space-y-3">
                                            {recentActivity.slice(0, 3).map(n => (
                                                <div key={n.id} className="flex gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                                    <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${n.status === 'success' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                                    <p className="text-[11px] font-bold text-gray-600 line-clamp-2">{n.message}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </button>
                            <Link to="/" className="p-2.5 rounded-xl bg-gray-50 text-gray-500 hover:bg-[#8E2A8B]/5 hover:text-[#8E2A8B] transition-all">
                                <ImageIcon size={20} />
                            </Link>
                        </div>

                        {view === 'list' && (
                            <button
                                onClick={() => { resetForm(); setView('add'); }}
                                className="bg-[#8E2A8B] text-white px-6 py-3 rounded-2xl flex items-center gap-3 hover:bg-[#722270] transition-all hover:shadow-xl hover:shadow-[#8E2A8B]/30 font-black text-sm uppercase tracking-wider"
                            >
                                <Plus size={18} />
                                Deploy Item
                            </button>
                        )}

                        <div className="flex items-center gap-3 pl-2">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-black text-[#2D1B4E]">Admin User</p>
                                <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Active Access</p>
                            </div>
                            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#8E2A8B] to-purple-800 p-[1px]">
                                <div className="h-full w-full rounded-[15px] bg-white p-1">
                                    <div className="h-full w-full rounded-xl bg-gray-100 flex items-center justify-center text-[#8E2A8B] font-black text-xs uppercase shadow-inner">
                                        K
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-8">
                    {view === 'dashboard' ? (
                        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
                            {/* Dashboard Header */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h1 className="text-3xl font-extrabold text-[#2D1B4E]">Intelligence Dashboard</h1>
                                    <p className="text-gray-500 mt-1">Welcome back, Admin. Here's what's happening today.</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100">
                                        <button
                                            onClick={() => setActiveTab('overview')}
                                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-[#8E2A8B] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                                        >
                                            Overview
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('analytics')}
                                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'analytics' ? 'bg-[#8E2A8B] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                                        >
                                            Analytics
                                        </button>
                                    </div>
                                    <button className="bg-white p-2.5 rounded-xl shadow-sm border border-gray-100 text-gray-400 hover:text-[#8E2A8B] transition-colors">
                                        <Calendar size={20} />
                                    </button>
                                </div>
                            </div>

                            {activeTab === 'overview' ? (
                                <>
                                    {/* Stats Grid - Innovative Look */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        {[
                                            { label: 'Total Revenue', value: `₹${totalSales.toLocaleString()}`, grow: salesGrowth, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                            { label: 'Total Orders', value: totalOrders, grow: ordersGrowth, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
                                            { label: 'Conversion Rate', value: '3.2%', grow: 1.2, icon: Activity, color: 'text-purple-600', bg: 'bg-purple-50' },
                                            { label: 'Avg Order Value', value: `₹${totalOrders > 0 ? (totalSales / totalOrders).toFixed(0) : 0}`, grow: -2.4, icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' }
                                        ].map((stat, i) => (
                                            <div key={i} className="glass-card stat-card-glow p-6 rounded-2xl group hover:transform hover:-translate-y-1 transition-all duration-300">
                                                <div className="flex justify-between items-start">
                                                    <div className={`p-3 ${stat.bg} ${stat.color} rounded-xl transition-transform group-hover:scale-110 duration-300`}>
                                                        <stat.icon size={24} />
                                                    </div>
                                                    <div className={`flex items-center gap-1 text-sm font-bold ${stat.grow >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                        {stat.grow >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                                                        {Math.abs(stat.grow).toFixed(1)}%
                                                    </div>
                                                </div>
                                                <div className="mt-4">
                                                    <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">{stat.label}</p>
                                                    <h3 className="text-3xl font-black text-[#2D1B4E] mt-1">{stat.value}</h3>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Main Dashboard Section: Charts & Activity */}
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                        {/* Sales Chart - Large */}
                                        <div className="lg:col-span-2 glass-card p-8 rounded-2xl">
                                            <div className="flex justify-between items-center mb-8">
                                                <div>
                                                    <h3 className="text-xl font-bold text-[#2D1B4E]">Revenue Overview</h3>
                                                    <p className="text-sm text-gray-500 mt-1">Monthly performance insights</p>
                                                </div>
                                                <select className="bg-gray-50 border border-gray-100 text-sm font-bold rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#8E2A8B]/20">
                                                    <option>Last 7 Months</option>
                                                    <option>Last Year</option>
                                                </select>
                                            </div>
                                            <div className="h-[350px] w-full">
                                                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                                    <AreaChart
                                                        data={[
                                                            { name: 'Jan', sales: 4000, orders: 120 },
                                                            { name: 'Feb', sales: 3000, orders: 90 },
                                                            { name: 'Mar', sales: 5000, orders: 150 },
                                                            { name: 'Apr', sales: 2780, orders: 100 },
                                                            { name: 'May', sales: 1890, orders: 80 },
                                                            { name: 'Jun', sales: 2390, orders: 110 },
                                                            { name: 'Jul', sales: 3490, orders: 130 },
                                                        ]}
                                                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                                                    >
                                                        <defs>
                                                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#8E2A8B" stopOpacity={0.1} />
                                                                <stop offset="95%" stopColor="#8E2A8B" stopOpacity={0} />
                                                            </linearGradient>
                                                            <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#2D1B4E" stopOpacity={0.1} />
                                                                <stop offset="95%" stopColor="#2D1B4E" stopOpacity={0} />
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} dy={10} />
                                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
                                                        <Tooltip
                                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '12px' }}
                                                            cursor={{ stroke: '#8E2A8B', strokeWidth: 2, strokeDasharray: '5 5' }}
                                                        />
                                                        <Area type="monotone" dataKey="sales" stroke="#8E2A8B" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
                                                        <Area type="monotone" dataKey="orders" stroke="#2D1B4E" strokeWidth={4} fillOpacity={1} fill="url(#colorOrders)" />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        {/* Recent Activity Sidebar */}
                                        <div className="glass-card p-8 rounded-2xl flex flex-col">
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="text-xl font-bold text-[#2D1B4E]">Live Activity</h3>
                                                <button className="text-[#8E2A8B] p-2 hover:bg-[#8E2A8B]/10 rounded-lg transition-colors">
                                                    <MoreVertical size={20} />
                                                </button>
                                            </div>
                                            <div className="space-y-6 flex-1">
                                                {recentActivity.map((activity) => (
                                                    <div key={activity.id} className="flex gap-4 group">
                                                        <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${activity.status === 'success' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : activity.status === 'warning' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'}`} />
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-800 leading-tight group-hover:text-[#8E2A8B] transition-colors cursor-default">{activity.message}</p>
                                                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                                                <Clock size={12} />
                                                                {activity.time}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <button className="mt-8 w-full py-3 rounded-xl border-2 border-dashed border-gray-100 text-gray-400 font-bold hover:border-[#8E2A8B] hover:text-[#8E2A8B] transition-all">
                                                View All Logs
                                            </button>
                                        </div>
                                    </div>

                                    {/* Bottom Grid: Top Products & Quick Actions */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {/* Top Products */}
                                        <div className="glass-card p-8 rounded-2xl">
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="text-xl font-bold text-[#2D1B4E]">Top Performing Products</h3>
                                                <button className="text-sm font-bold text-[#8E2A8B] hover:underline">See Details</button>
                                            </div>
                                            <div className="space-y-4">
                                                {topProducts.map((product, i) => (
                                                    <div key={i} className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-12 w-12 rounded-lg overflow-hidden bg-gray-100">
                                                                <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-gray-800">{product.name}</p>
                                                                <p className="text-xs text-gray-400">{product.sales} sales this week</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-black text-[#2D1B4E]">₹{(product.sales * 1200).toLocaleString()}</p>
                                                            <p className="text-xs text-emerald-500 font-bold flex items-center justify-end gap-1">
                                                                <TrendingUp size={12} />
                                                                +{product.growth}%
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Quick Actions / Bento Items */}
                                        <div className="grid grid-cols-2 gap-4">
                                            {[
                                                { title: 'New Product', icon: Plus, desc: 'Add item to store', action: () => setView('add'), color: 'bg-purple-600' },
                                                { title: 'Check Stocks', icon: Package, desc: '9 items low', action: () => setView('stocks'), color: 'bg-orange-500' },
                                                { title: 'Manage Orders', icon: ShoppingBag, desc: '4 pending today', action: () => setView('orders'), color: 'bg-blue-600' },
                                                { title: 'View Reviews', icon: MessageSquareQuote, desc: 'Manage feedback', action: () => setView('reviews'), color: 'bg-pink-600' }
                                            ].map((action, i) => (
                                                <button
                                                    key={i}
                                                    onClick={action.action}
                                                    className="glass-card p-6 rounded-2xl flex flex-col items-center justify-center text-center group hover:shadow-2xl hover:shadow-[#8E2A8B]/10 transition-all duration-300 border-b-4 hover:border-b-[#8E2A8B]"
                                                >
                                                    <div className={`p-4 ${action.color} text-white rounded-2xl mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                                                        <action.icon size={28} />
                                                    </div>
                                                    <h4 className="font-black text-[#2D1B4E] uppercase text-xs tracking-widest">{action.title}</h4>
                                                    <p className="text-sm text-gray-500 mt-1">{action.desc}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                        <div className="lg:col-span-2 glass-card p-8 rounded-3xl">
                                            <h3 className="text-xl font-black text-[#2D1B4E] mb-6">Regional Sales Trends</h3>
                                            <div className="h-[300px]">
                                                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                                    <BarChart data={[
                                                        { name: 'North', sales: 4000 },
                                                        { name: 'South', sales: 7000 },
                                                        { name: 'East', sales: 2000 },
                                                        { name: 'West', sales: 5000 },
                                                        { name: 'Central', sales: 3000 },
                                                    ]}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                                        <YAxis axisLine={false} tickLine={false} />
                                                        <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                                        <Bar dataKey="sales" fill="#8E2A8B" radius={[8, 8, 0, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                        <div className="glass-card p-8 rounded-3xl flex flex-col items-center">
                                            <h3 className="text-xl font-black text-[#2D1B4E] mb-6 self-start">Category Share</h3>
                                            <div className="h-[300px] w-full">
                                                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                                    <PieChart>
                                                        <Pie
                                                            data={[
                                                                { name: 'Safety', value: 40 },
                                                                { name: 'Industrial', value: 30 },
                                                                { name: 'Custom', value: 20 },
                                                                { name: 'Other', value: 10 },
                                                            ]}
                                                            innerRadius={60}
                                                            outerRadius={80}
                                                            paddingAngle={5}
                                                            dataKey="value"
                                                        >
                                                            {[
                                                                { color: '#8E2A8B' },
                                                                { color: '#2D1B4E' },
                                                                { color: '#722270' },
                                                                { color: '#94A3B8' }
                                                            ].map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip />
                                                        <Legend verticalAlign="bottom" height={36} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {[
                                            { label: 'Avg Session', value: '4m 32s', icon: Clock, color: 'text-blue-500' },
                                            { label: 'Bounce Rate', value: '24.8%', icon: Activity, color: 'text-rose-500' },
                                            { label: 'New Users', value: '1,284', icon: Users, color: 'text-emerald-500' }
                                        ].map((item, i) => (
                                            <div key={i} className="glass-card p-6 rounded-2xl flex items-center gap-4">
                                                <div className={`p-3 rounded-xl bg-gray-50 ${item.color}`}>
                                                    <item.icon size={24} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{item.label}</p>
                                                    <p className="text-xl font-black text-[#2D1B4E]">{item.value}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : view === 'videos' ? (
                        <div className="space-y-8 max-w-5xl mx-auto">
                            {/* Add Video Form */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-lg font-bold text-[#2D1B4E] mb-4">Add New Video</h3>
                                <form onSubmit={handleAddVideo} className="flex flex-col md:flex-row gap-4 items-end">
                                    <div className="flex-1 space-y-1 w-full">
                                        <label className="text-sm font-bold text-gray-700">Video Title</label>
                                        <input
                                            type="text"
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#8E2A8B]/20 focus:border-[#8E2A8B]"
                                            placeholder="e.g. Kottravai in Action"
                                            value={newVideo.title}
                                            onChange={e => setNewVideo({ ...newVideo, title: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex-1 space-y-1 w-full">
                                        <label className="text-sm font-bold text-gray-700">YouTube URL</label>
                                        <input
                                            type="text"
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#8E2A8B]/20 focus:border-[#8E2A8B]"
                                            placeholder="https://www.youtube.com/watch?v=..."
                                            value={newVideo.url}
                                            onChange={e => setNewVideo({ ...newVideo, url: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        {editingVideoId && (
                                            <button
                                                type="button"
                                                onClick={cancelVideoEdit}
                                                className="bg-gray-500 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-gray-600 transition-colors flex-shrink-0"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                        <button
                                            type="submit"
                                            className="bg-[#2D1B4E] text-white px-6 py-2.5 rounded-lg font-bold hover:bg-[#8E2A8B] transition-colors flex-shrink-0"
                                        >
                                            {editingVideoId ? 'Update Video' : 'Add Video'}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Video List */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-lg font-bold text-[#2D1B4E] mb-6">Current Videos</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {videos.map(video => (
                                        <div key={video.id} className="border border-gray-200 rounded-lg overflow-hidden group relative">
                                            <div className="aspect-video bg-gray-100 relative">
                                                <iframe
                                                    className="w-full h-full"
                                                    src={video.url}
                                                    title={video.title}
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    loading="lazy"
                                                ></iframe>
                                            </div>
                                            <div className="p-4">
                                                <h4 className="font-bold text-gray-800 leading-tight mb-2 line-clamp-2">{video.title}</h4>
                                                <div className="flex justify-between items-center mt-4">
                                                    <span className="text-xs text-gray-400">ID: {video.id}</span>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleEditVideo(video)}
                                                            className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-full transition-colors"
                                                            title="Edit Video"
                                                        >
                                                            <Pencil size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                if (window.confirm(`Delete video "${video.title}"?`)) {
                                                                    deleteVideo(video.id);
                                                                    toast.success("Video deleted");
                                                                }
                                                            }}
                                                            className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-full transition-colors"
                                                            title="Delete Video"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {videos.length === 0 && (
                                        <div className="col-span-full text-center py-10 text-gray-400">
                                            No videos added yet.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : view === 'news' ? (
                        <div className="space-y-8 max-w-5xl mx-auto">
                            {/* Add News Form */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-lg font-bold text-[#2D1B4E] mb-4">{editingNewsId ? 'Edit News' : 'Add New News'}</h3>
                                <form onSubmit={handleAddNews} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-sm font-bold text-gray-700">Title</label>
                                            <input
                                                type="text"
                                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#8E2A8B]/20 focus:border-[#8E2A8B]"
                                                value={newsForm.title}
                                                onChange={e => setNewsForm({ ...newsForm, title: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-sm font-bold text-gray-700">Category</label>
                                            <input
                                                type="text"
                                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#8E2A8B]/20 focus:border-[#8E2A8B]"
                                                placeholder="e.g. Innovation"
                                                value={newsForm.category}
                                                onChange={e => setNewsForm({ ...newsForm, category: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-sm font-bold text-gray-700">Date</label>
                                            <input
                                                type="text"
                                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#8E2A8B]/20 focus:border-[#8E2A8B]"
                                                placeholder="e.g. June 01, 2025"
                                                value={newsForm.date}
                                                onChange={e => setNewsForm({ ...newsForm, date: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-sm font-bold text-gray-700">Read More Link</label>
                                            <input
                                                type="text"
                                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#8E2A8B]/20 focus:border-[#8E2A8B]"
                                                value={newsForm.link}
                                                onChange={e => setNewsForm({ ...newsForm, link: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* Image Upload for News */}
                                    <div className="space-y-1">
                                        <label className="text-sm font-bold text-gray-700">News Image</label>
                                        <div className="flex items-center gap-4">
                                            {newsForm.image && (
                                                <div className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                                                    <img src={newsForm.image} alt="Preview" className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                                Upload Image
                                                <input type="file" className="hidden" accept="image/*" onChange={handleNewsImageUpload} />
                                            </label>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        {editingNewsId && (
                                            <button
                                                type="button"
                                                onClick={cancelNewsEdit}
                                                className="bg-gray-500 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-gray-600 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                        <button
                                            type="submit"
                                            disabled={isUploading}
                                            className="bg-[#2D1B4E] text-white px-6 py-2.5 rounded-lg font-bold hover:bg-[#8E2A8B] transition-colors flex items-center gap-2 disabled:bg-gray-400"
                                        >
                                            {isUploading ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                    Saving...
                                                </>
                                            ) : (
                                                editingNewsId ? 'Update News' : 'Add News'
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* News List */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-lg font-bold text-[#2D1B4E] mb-6">Current News Items</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {newsItems.map(item => (
                                        <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden group">
                                            <div className="h-48 bg-gray-100 relative">
                                                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="p-4">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-xs font-bold text-[#8E2A8B] uppercase tracking-wider">{item.category}</span>
                                                    <span className="text-xs text-gray-400">{item.date}</span>
                                                </div>
                                                <h4 className="font-bold text-gray-800 leading-tight mb-4 line-clamp-2">{item.title}</h4>
                                                <div className="flex justify-end gap-2 mt-auto">
                                                    <button
                                                        onClick={() => handleEditNews(item)}
                                                        className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-full transition-colors"
                                                        title="Edit News"
                                                    >
                                                        <Pencil size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (window.confirm(`Delete news item "${item.title}"?`)) {
                                                                deleteNewsItem(item.id);
                                                                toast.success("News item deleted");
                                                            }
                                                        }}
                                                        className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-full transition-colors"
                                                        title="Delete News"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {newsItems.length === 0 && (
                                        <div className="col-span-full text-center py-10 text-gray-400">
                                            No news items added yet.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : view === 'reviews' ? (
                        <div className="space-y-8 max-w-5xl mx-auto">
                            {/* Review Page Selector */}
                            <div className="flex gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                <button
                                    onClick={() => { setReviewPage('home'); cancelReviewEdit(); }}
                                    className={`px-6 py-2 rounded-lg font-bold transition-all ${reviewPage === 'home' ? 'bg-[#8E2A8B] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                >
                                    Home Page Reviews
                                </button>
                                <button
                                    onClick={() => { setReviewPage('b2b'); cancelReviewEdit(); }}
                                    className={`px-6 py-2 rounded-lg font-bold transition-all ${reviewPage === 'b2b' ? 'bg-[#8E2A8B] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                >
                                    B2B Page Reviews
                                </button>
                            </div>

                            {/* Add/Edit Review Form */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-lg font-bold text-[#2D1B4E] mb-4">{editingReviewId ? 'Edit Review' : `Add New Review (${reviewPage === 'home' ? 'Home' : 'B2B'})`}</h3>
                                <form onSubmit={handleAddReview} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-sm font-bold text-gray-700">Name</label>
                                            <input
                                                type="text"
                                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#8E2A8B]/20 focus:border-[#8E2A8B]"
                                                value={reviewForm.name}
                                                onChange={e => setReviewForm({ ...reviewForm, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-sm font-bold text-gray-700">Role / Title</label>
                                            <input
                                                type="text"
                                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#8E2A8B]/20 focus:border-[#8E2A8B]"
                                                value={reviewForm.role}
                                                onChange={e => setReviewForm({ ...reviewForm, role: e.target.value })}
                                                placeholder={reviewPage === 'b2b' ? 'e.g. CEO, Company Name' : 'e.g. Customer - Location'}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-sm font-bold text-gray-700">Content</label>
                                        <textarea
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#8E2A8B]/20 focus:border-[#8E2A8B] h-32"
                                            value={reviewForm.content}
                                            onChange={e => setReviewForm({ ...reviewForm, content: e.target.value })}
                                        ></textarea>
                                    </div>

                                    {/* Image Upload for Review */}
                                    <div className="space-y-1">
                                        <label className="text-sm font-bold text-gray-700">Profile Image (Optional)</label>
                                        <div className="flex items-center gap-4">
                                            {reviewForm.image && (
                                                <div className="w-16 h-16 rounded-full overflow-hidden border border-gray-200">
                                                    <img src={reviewForm.image} alt="Preview" className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                                Upload Image
                                                <input type="file" className="hidden" accept="image/*" onChange={handleReviewImageUpload} />
                                            </label>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        {editingReviewId && (
                                            <button
                                                type="button"
                                                onClick={cancelReviewEdit}
                                                className="bg-gray-500 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-gray-600 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                        <button
                                            type="submit"
                                            disabled={isUploading}
                                            className="bg-[#2D1B4E] text-white px-6 py-2.5 rounded-lg font-bold hover:bg-[#8E2A8B] transition-colors flex items-center gap-2 disabled:bg-gray-400"
                                        >
                                            {isUploading ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                    Saving...
                                                </>
                                            ) : (
                                                editingReviewId ? 'Update Review' : 'Add Review'
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Reviews List */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-lg font-bold text-[#2D1B4E] mb-6">Current Reviews</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    {filteredReviews.map(review => (
                                        <div key={review.id} className="border border-gray-200 rounded-lg p-4 flex gap-4 items-start">
                                            <div className="w-12 h-12 rounded-full bg-gray-100 flex-shrink-0 overflow-hidden">
                                                {review.image ? <img src={review.image} alt={review.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400">?</div>}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-bold text-gray-900">{review.name}</h4>
                                                        <p className="text-xs text-[#8E2A8B] font-bold uppercase tracking-wider">{review.role}</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleEditReview(review)} className="text-blue-500 hover:text-blue-700 p-1"><Pencil size={16} /></button>
                                                        <button onClick={() => {
                                                            if (window.confirm(`Delete review from "${review.name}"?`)) {
                                                                deleteReview(review.id);
                                                                toast.success("Review deleted");
                                                            }
                                                        }} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={16} /></button>
                                                    </div>
                                                </div>
                                                <p className="text-gray-600 text-sm mt-2">{review.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {filteredReviews.length === 0 && (
                                        <div className="text-center py-8 text-gray-400">No reviews found for this page.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : view === 'partners' ? (
                        <div className="space-y-8 max-w-5xl mx-auto">
                            {/* Add Partner Form */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-lg font-bold text-[#2D1B4E] mb-4">{editingPartnerId ? 'Edit Trusted Partner' : 'Add New Trusted Partner'}</h3>
                                <form onSubmit={handleAddPartner} className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-sm font-bold text-gray-700">Partner Name</label>
                                        <input
                                            type="text"
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#8E2A8B]/20 focus:border-[#8E2A8B]"
                                            value={partnerForm.name}
                                            onChange={e => setPartnerForm({ ...partnerForm, name: e.target.value })}
                                            placeholder="e.g. Company Name"
                                        />
                                    </div>

                                    {/* Logo Upload */}
                                    <div className="space-y-1">
                                        <label className="text-sm font-bold text-gray-700">Logo</label>
                                        <div className="flex items-center gap-4">
                                            {partnerForm.logo ? (
                                                <div className="w-32 h-16 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center p-2">
                                                    <img src={partnerForm.logo} alt="Preview" className="max-w-full max-h-full object-contain" />
                                                </div>
                                            ) : (
                                                <div className="w-32 h-16 rounded-lg border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-gray-400 text-xs">
                                                    No Logo
                                                </div>
                                            )}
                                            <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                                Upload Logo
                                                <input type="file" className="hidden" accept="image/*" onChange={handlePartnerLogoUpload} />
                                            </label>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        {editingPartnerId && (
                                            <button
                                                type="button"
                                                onClick={cancelPartnerEdit}
                                                className="bg-gray-500 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-gray-600 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                        <button
                                            type="submit"
                                            disabled={isUploading}
                                            className="bg-[#2D1B4E] text-white px-6 py-2.5 rounded-lg font-bold hover:bg-[#8E2A8B] transition-colors flex items-center gap-2 disabled:bg-gray-400"
                                        >
                                            {isUploading ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                    Saving...
                                                </>
                                            ) : (
                                                editingPartnerId ? 'Update Partner' : 'Add Partner'
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Partners List */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-lg font-bold text-[#2D1B4E] mb-6">Current Trusted Partners</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {partners.map(partner => (
                                        <div key={partner.id} className="border border-gray-200 rounded-lg p-4 flex flex-col items-center justify-between h-40 bg-gray-50 group relative">
                                            <div className="flex-1 flex items-center justify-center w-full p-2">
                                                {partner.logo ? (
                                                    <img src={partner.logo} alt={partner.name} className="max-w-full max-h-20 object-contain" />
                                                ) : (
                                                    <span className="text-gray-500 font-bold text-center">{partner.name}</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 font-medium mt-2">{partner.name}</p>

                                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEditPartner(partner)} className="bg-white text-blue-500 p-1.5 rounded-full shadow-sm hover:text-blue-700"><Pencil size={14} /></button>
                                                <button onClick={() => {
                                                    if (window.confirm(`Delete partner "${partner.name}"?`)) {
                                                        deletePartner(partner.id);
                                                        toast.success("Partner deleted");
                                                    }
                                                }} className="bg-white text-red-500 p-1.5 rounded-full shadow-sm hover:text-red-700"><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                    ))}
                                    {partners.length === 0 && (
                                        <div className="col-span-full text-center py-10 text-gray-400">
                                            No partners added yet.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : view === 'affiliates' ? (
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <h3 className="text-2xl font-black text-[#2D1B4E] admin-gradient-text">Affiliate Program</h3>
                                    <p className="text-gray-500 text-sm font-medium mt-1">Review and manage your brand ambassadors</p>
                                </div>
                                <div className="flex gap-3">
                                    <div className="bg-white px-4 py-2 rounded-2xl border border-emerald-100 shadow-sm flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                        <div>
                                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Approved</div>
                                            <div className="text-lg font-black text-emerald-600 leading-tight">
                                                {affiliateApplications.filter(a => a.status === 'Approved').length}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white px-4 py-2 rounded-2xl border border-amber-100 shadow-sm flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                                        <div>
                                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Pending</div>
                                            <div className="text-lg font-black text-amber-600 leading-tight">
                                                {affiliateApplications.filter(a => a.status === 'pending' || a.status === 'Pending').length}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {affiliateApplications.map((app) => (
                                    <div key={app.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 group overflow-hidden flex flex-col">
                                        {/* Card Header */}
                                        <div className="p-6 pb-4 flex justify-between items-start border-b border-gray-50 bg-gray-50/30">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2D1B4E] to-[#8E2A8B] flex items-center justify-center text-white font-black text-xl shadow-lg transform group-hover:rotate-6 transition-transform">
                                                    {app.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-[#2D1B4E] leading-tight text-lg line-clamp-1">{app.name}</h4>
                                                    <div className="text-xs font-bold text-[#8E2A8B] flex items-center gap-1 mt-1">
                                                        <Clock size={12} />
                                                        {new Date(app.created_at).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm ${
                                                app.status === 'Approved' ? 'bg-emerald-500 text-white' : 
                                                app.status === 'Rejected' ? 'bg-rose-500 text-white' : 
                                                'bg-amber-100 text-amber-700'
                                            }`}>
                                                {app.status}
                                            </span>
                                        </div>

                                        {/* Card Content */}
                                        <div className="p-6 space-y-5 flex-1">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Contact</p>
                                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                                                        <Phone size={14} className="text-[#8E2A8B]" />
                                                        {app.phone}
                                                    </div>
                                                </div>
                                                <div className="space-y-1 text-right">
                                                    <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Location</p>
                                                    <p className="text-xs font-bold text-gray-700">{app.city || 'N/A'}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-1">
                                                <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Email Address</p>
                                                <p className="text-xs font-bold text-gray-600 truncate">{app.email}</p>
                                            </div>

                                            <div className="space-y-1 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                                <p className="text-[10px] uppercase font-black text-[#8E2A8B] tracking-widest mb-2 flex items-center gap-2">
                                                    <Activity size={12} /> Experience: {app.selling_experience || 'None'}
                                                </p>
                                                <p className="text-xs font-medium text-gray-600 line-clamp-3 italic leading-relaxed">
                                                    "{app.reason || 'No reason provided.'}"
                                                </p>
                                            </div>

                                            <div className="flex flex-wrap gap-2 pt-2">
                                                {app.instagram_link && (
                                                    <a href={app.instagram_link} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] text-white flex items-center justify-center hover:scale-110 transition-transform shadow-md">
                                                        <Instagram size={18} />
                                                    </a>
                                                )}
                                                {app.facebook_link && (
                                                    <a href={app.facebook_link} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl bg-[#1877F2] text-white flex items-center justify-center hover:scale-110 transition-transform shadow-md">
                                                        <Facebook size={18} />
                                                    </a>
                                                )}
                                                {app.youtube_link && (
                                                    <a href={app.youtube_link} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl bg-[#FF0000] text-white flex items-center justify-center hover:scale-110 transition-transform shadow-md">
                                                        <Youtube size={18} />
                                                    </a>
                                                )}
                                                {app.twitter_link && (
                                                    <a href={app.twitter_link} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl bg-[#1DA1F2] text-white flex items-center justify-center hover:scale-110 transition-transform shadow-md">
                                                        <Twitter size={18} />
                                                    </a>
                                                )}
                                            </div>
                                        </div>

                                        {/* Card Footer Actions */}
                                        <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex gap-3">
                                            {(app.status === 'pending' || app.status === 'Pending') ? (
                                                <>
                                                    <button 
                                                        onClick={() => handleUpdateAffiliateStatus(app.id, 'Approved')}
                                                        className="flex-1 bg-emerald-500 text-white font-black text-xs py-3 rounded-2xl hover:bg-emerald-600 transition-all shadow-[0_5px_15px_rgba(16,185,129,0.3)] shadow-emerald-500/30 flex items-center justify-center gap-2"
                                                    >
                                                        <UserCheck size={16} />
                                                        APPROVE
                                                    </button>
                                                    <button 
                                                        onClick={() => handleUpdateAffiliateStatus(app.id, 'Rejected')}
                                                        className="flex-none bg-rose-50 text-rose-500 p-3 rounded-2xl hover:bg-rose-500 hover:text-white transition-all border border-rose-100"
                                                        title="Reject"
                                                    >
                                                        <X size={20} />
                                                    </button>
                                                </>
                                            ) : (
                                                <button 
                                                    onClick={() => handleUpdateAffiliateStatus(app.id, 'Pending')}
                                                    className="w-full py-3 rounded-2xl bg-gray-100 text-gray-500 text-xs font-black hover:bg-gray-200 transition-all border border-gray-200 flex items-center justify-center gap-2"
                                                >
                                                    <Clock size={16} />
                                                    RESET TO PENDING
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {affiliateApplications.length === 0 && (
                                    <div className="col-span-full py-20 bg-white rounded-3xl border border-dashed border-gray-200 flex flex-col items-center justify-center gap-4">
                                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                                            <TrendingUp size={40} />
                                        </div>
                                        <p className="text-gray-400 font-black uppercase tracking-widest text-sm">No applications to display</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : view === 'affiliate-partners' ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-[#2D1B4E]">Active Affiliate Partners</h3>
                                <div className="flex gap-4 items-center">
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-hover:text-[#8E2A8B] transition-colors">
                                            <Search size={14} />
                                        </div>
                                        <input 
                                            type="text" 
                                            placeholder="Search ambassadors..."
                                            className="bg-gray-50 border border-gray-100 pl-9 pr-4 py-2 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#8E2A8B]/20 transition-all outline-none w-64"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    <div className="text-sm text-gray-500 font-bold uppercase tracking-widest">{activeAffiliates.length} Partners Linked</div>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-gray-50 border-b border-gray-100">
                                        <tr>
                                            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Ambassador</th>
                                            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Referral Code</th>
                                            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Achievement Level</th>
                                            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400 text-right">Commission Ledger</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {activeAffiliates
                                            .filter(a => !searchQuery || a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.email.toLowerCase().includes(searchQuery.toLowerCase()))
                                            .map((affiliate) => (
                                            <tr key={affiliate.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#8E2A8B] flex items-center justify-center font-bold">
                                                            {affiliate.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-gray-900">{affiliate.name}</div>
                                                            <div className="text-xs text-gray-500">{affiliate.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <code className="bg-gray-100 px-3 py-1.5 rounded-lg text-sm font-black text-[#8E2A8B] tracking-wider uppercase border border-gray-200">
                                                        {affiliate.referral_code}
                                                    </code>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <select 
                                                        value={affiliate.level || 'Ambassador'}
                                                        onChange={(e) => handleUpdateAffiliateLevel(affiliate.id, e.target.value)}
                                                        className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-black text-[#2D1B4E] focus:ring-2 focus:ring-[#8E2A8B]/20 outline-none transition-all shadow-sm cursor-pointer hover:border-[#8E2A8B]"
                                                    >
                                                        <option value="Ambassador">Ambassador</option>
                                                        <option value="Kottravai Seller">Kottravai Seller</option>
                                                        <option value="Kottravai Pro Partner">Kottravai Pro Partner</option>
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <div className="text-sm font-black text-gray-900">₹{parseFloat(affiliate.total_commission).toLocaleString()} Earning</div>
                                                        <div className="text-[10px] font-bold text-gray-400 uppercase">From ₹{parseFloat(affiliate.total_sales).toLocaleString()} Sales</div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {activeAffiliates.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center text-gray-400 font-bold uppercase tracking-widest text-sm italic">
                                                    No approved affiliates yet.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : view === 'affiliate-dashboard' ? (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            {/* Dashboard Hero Header */}
                            <div className="bg-gradient-to-br from-[#2D1B4E] to-[#1A1A1A] rounded-[2rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-96 h-96 bg-[#8E2A8B]/10 rounded-full -mr-20 -mt-20 blur-3xl transition-all duration-1000 group-hover:bg-[#8E2A8B]/20"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 text-xs font-black uppercase tracking-widest text-white/80">
                                            Affiliate Control Tower
                                        </div>
                                    </div>
                                    <h3 className="text-4xl font-black mb-4 leading-none">Affiliate Performance <span className="text-[#8E2A8B]">Analytics</span></h3>
                                    <p className="text-white/60 max-w-xl font-medium text-lg">Monitor sales, commissions, and performance of your brand ambassadors in real-time.</p>
                                </div>
                            </div>

                            {/* Performance Cards Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {/* Total Affiliate Sales Card */}
                                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl hover:shadow-2xl transition-all duration-500 group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-emerald-50 rounded-2xl group-hover:bg-emerald-500 transition-colors duration-500">
                                            <TrendingUp size={24} className="text-emerald-500 group-hover:text-white transition-colors duration-500" />
                                        </div>
                                        <div className="flex items-center gap-1 text-emerald-600 font-black text-sm">
                                            <ArrowUpRight size={16} />
                                            <span>Active</span>
                                        </div>
                                    </div>
                                    <div className="text-3xl font-black text-[#2D1B4E] mb-1">
                                        ₹{affiliateSales.reduce((sum, s) => sum + parseFloat(s.sale_amount || 0), 0).toLocaleString()}
                                    </div>
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Affiliate Revenue</div>
                                </div>

                                {/* Pending Commissions Card */}
                                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl hover:shadow-2xl transition-all duration-500 group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-amber-50 rounded-2xl group-hover:bg-amber-500 transition-colors duration-500">
                                            <DollarSign size={24} className="text-amber-500 group-hover:text-white transition-colors duration-500" />
                                        </div>
                                        <div className="bg-amber-100 text-amber-700 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                            Requires Audit
                                        </div>
                                    </div>
                                    <div className="text-3xl font-black text-[#2D1B4E] mb-1">
                                        ₹{affiliateSales.filter(s => s.status === 'Completed').reduce((sum, s) => sum + parseFloat(s.commission_amount || 0), 0).toLocaleString()}
                                    </div>
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Commission Earnings</div>
                                </div>

                                {/* Active Partners Card */}
                                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl hover:shadow-2xl transition-all duration-500 group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-purple-50 rounded-2xl group-hover:bg-[#8E2A8B] transition-colors duration-500">
                                            <Users size={24} className="text-[#8E2A8B] group-hover:text-white transition-colors duration-500" />
                                        </div>
                                        <span className="text-[10px] font-black text-purple-600 bg-purple-50 px-2 py-1 rounded-lg uppercase tracking-wider">Growth Hub</span>
                                    </div>
                                    <div className="text-3xl font-black text-[#2D1B4E] mb-1">
                                        {activeAffiliates.length}
                                    </div>
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Brand Partners</div>
                                </div>

                                {/* Conversions Card */}
                                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl hover:shadow-2xl transition-all duration-500 group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-blue-50 rounded-2xl group-hover:bg-blue-500 transition-colors duration-500">
                                            <Package size={24} className="text-blue-500 group-hover:text-white transition-colors duration-500" />
                                        </div>
                                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg uppercase tracking-wider">Success Rate</span>
                                    </div>
                                    <div className="text-3xl font-black text-[#2D1B4E] mb-1">
                                        {affiliateSales.length}
                                    </div>
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tracked Conversions</div>
                                </div>
                            </div>

                            {/* Visual Analytics Hub */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl">
                                    <h4 className="text-xl font-black text-[#2D1B4E] mb-6">Partner Performance Matrix</h4>
                                    <div className="h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={activeAffiliates.map(a => ({ name: a.name, commission: parseFloat(a.total_commission || 0) })).sort((a,b) => b.commission - a.commission).slice(0, 5)}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontWeight: '900', fontSize: 10}} dy={10} />
                                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontWeight: '900', fontSize: 10}} />
                                                <Tooltip 
                                                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: '900'}}
                                                    cursor={{fill: '#F9FAFB'}}
                                                />
                                                <Bar dataKey="commission" fill="#8E2A8B" radius={[8, 8, 8, 8]} barSize={40} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl">
                                    <h4 className="text-xl font-black text-[#2D1B4E] mb-6">Product Attribution</h4>
                                    <div className="h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={Object.entries(
                                                        affiliateSales.reduce((acc: any, s) => {
                                                            acc[s.product_name || 'Legacy'] = (acc[s.product_name || 'Legacy'] || 0) + parseFloat(s.sale_amount);
                                                            return acc;
                                                        }, {})
                                                    ).map(([name, value]) => ({ name, value })).sort((a: any, b: any) => b.value - a.value).slice(0, 5)}
                                                    innerRadius={60}
                                                    outerRadius={100}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {[0, 1, 2, 3, 4].map((index) => (
                                                        <Cell key={`cell-${index}`} fill={['#2D1B4E', '#8E2A8B', '#FFD700', '#48BB78', '#3182CE'][index % 5]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip 
                                                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: '900'}}
                                                />
                                                <Legend iconType="circle" wrapperStyle={{fontWeight: '900', fontSize: '10px'}} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            {/* Sales Stream Table */}
                            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden">
                                <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div>
                                        <h4 className="text-xl font-black text-[#2D1B4E]">Affiliate Sales Stream</h4>
                                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Real-time attribution and commission tracking</p>
                                    </div>
                                    <div className="flex gap-4 w-full md:w-auto">
                                        <select 
                                            value={selectedAffiliateFilter}
                                            onChange={(e) => setSelectedAffiliateFilter(e.target.value)}
                                            className="bg-gray-50 border border-gray-100 px-4 py-2.5 rounded-2xl text-xs font-black text-[#2D1B4E] focus:ring-2 focus:ring-[#8E2A8B]/20 transition-all outline-none"
                                        >
                                            <option value="all">Every Ambassador</option>
                                            {activeAffiliates.map(a => (
                                                <option key={a.id} value={a.id}>{a.name}</option>
                                            ))}
                                        </select>
                                        <button 
                                            onClick={fetchAffiliateSales}
                                            className="bg-gray-50 hover:bg-gray-100 text-[#2D1B4E] px-6 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-gray-100 flex items-center gap-2"
                                        >
                                            <Activity size={16} />
                                            Refresh
                                        </button>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-gray-50 border-b border-gray-100">
                                            <tr>
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Order ID</th>
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Affiliate</th>
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Sale Amount</th>
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-center">Commission</th>
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {affiliateSales
                                              .filter(s => selectedAffiliateFilter === 'all' || s.affiliate_id === selectedAffiliateFilter)
                                              .map((sale) => (
                                                <tr key={sale.id} className="hover:bg-gray-50/50 transition-all group">
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-1.5 h-6 bg-emerald-500 rounded-full group-hover:h-8 transition-all"></div>
                                                            <div>
                                                                <div className="font-black text-[#2D1B4E] text-sm">#{sale.order_number || sale.order_id}</div>
                                                                <div className="text-[10px] font-bold text-gray-400">{new Date(sale.created_at).toLocaleDateString()}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="font-black text-[#2D1B4E] text-xs uppercase tracking-wider">{sale.product_name || 'N/A'}</div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <div className="text-[10px] text-gray-400 font-bold">Via {sale.affiliate_name || 'Partner'}</div>
                                                            <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                                                            <code className="text-[9px] bg-purple-50 text-[#8E2A8B] px-1.5 py-0.5 rounded border border-purple-100 font-black uppercase tracking-tighter">
                                                                {sale.link_slug || 'DIRECT'}
                                                            </code>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="font-black text-[#2D1B4E] text-sm">₹{parseFloat(sale.sale_amount).toLocaleString()}</div>
                                                    </td>
                                                    <td className="px-8 py-5 text-center">
                                                        <div className="inline-block px-3 py-1 bg-emerald-50 rounded-lg">
                                                            <div className="text-xs font-black text-emerald-600">₹{parseFloat(sale.commission_amount).toLocaleString()}</div>
                                                            <div className="text-[9px] font-black text-emerald-400 uppercase">{sale.commission_rate}% Rate</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm ${
                                                            sale.status === 'Completed' ? 'bg-emerald-500 text-white' : 
                                                            sale.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 
                                                            'bg-rose-50 text-rose-500'
                                                        }`}>
                                                            {sale.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                            {affiliateSales.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="px-8 py-20 text-center">
                                                        <div className="flex flex-col items-center justify-center gap-6">
                                                            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-gray-200">
                                                                <TrendingUp size={48} />
                                                            </div>
                                                            <div>
                                                                <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-sm">No sales stream detected</p>
                                                                <p className="text-gray-300 text-xs font-bold mt-2">Affiliate conversions will appear here in real-time</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ) : view === 'alliance-apps' ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                                <h3 className="text-lg font-bold text-[#2D1B4E]">Alliance Applications</h3>
                                <button
                                    onClick={() => {
                                        const token = sessionStorage.getItem('kottravai_admin_token');
                                        window.open(`${import.meta.env.VITE_API_URL || '/api'}/alliance/export?token=${token || ''}`, '_blank');
                                    }}
                                    className="flex items-center gap-2 bg-[#1A1A1A] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#8E2A8B] transition-all shadow-lg hover:shadow-[#8E2A8B]/20"
                                >
                                    <ImageIcon size={16} className="text-[#FFD700]" />
                                    Export to Excel (.csv)
                                </button>
                            </div>
                            <div className="overflow-x-auto border border-gray-100 rounded-xl">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-gray-50 border-b border-gray-100">
                                        <tr>
                                            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">Applicant</th>
                                            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">Contact</th>
                                            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">Address</th>
                                            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">Socials</th>
                                            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {allianceApps.map((app) => (
                                            <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-[#8E2A8B]/10 flex items-center justify-center text-[#8E2A8B] font-bold text-xs">
                                                            {app.name.charAt(0)}
                                                        </div>
                                                        <span className="font-bold text-gray-900">{app.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                                                            <Phone size={12} className="text-[#8E2A8B]" />
                                                            {app.phone}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 max-w-xs">
                                                    <p className="text-xs text-gray-600 line-clamp-2">{app.address}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        {app.insta_id && (
                                                            <a href={`https://instagram.com/${app.insta_id.replace('@', '')}`} target="_blank" className="text-[#E4405F] hover:scale-110 transition-transform">
                                                                <Instagram size={16} />
                                                            </a>
                                                        )}
                                                        {app.facebook_id && (
                                                            <a href={app.facebook_id} target="_blank" className="text-[#1877F2] hover:scale-110 transition-transform">
                                                                <Facebook size={16} />
                                                            </a>
                                                        )}
                                                        {app.linkedin_id && (
                                                            <a href={app.linkedin_id.startsWith('http') ? app.linkedin_id : `https://linkedin.com/in/${app.linkedin_id.replace('@', '')}`} target="_blank" className="text-[#0A66C2] hover:scale-110 transition-transform">
                                                                <Linkedin size={16} />
                                                            </a>
                                                        )}
                                                        {app.twitter_id && (
                                                            <a href={app.twitter_id.startsWith('http') ? app.twitter_id : `https://twitter.com/${app.twitter_id.replace('@', '')}`} target="_blank" className="text-[#1DA1F2] hover:scale-110 transition-transform">
                                                                <Twitter size={16} />
                                                            </a>
                                                        )}
                                                        {app.youtube_id && (
                                                            <a href={app.youtube_id} target="_blank" className="text-[#FF0000] hover:scale-110 transition-transform">
                                                                <Youtube size={16} />
                                                            </a>
                                                        )}
                                                        {!app.insta_id && !app.facebook_id && !app.linkedin_id && !app.twitter_id && !app.youtube_id && <span className="text-gray-400 text-xs">None</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-gray-500 font-medium">
                                                    {new Date(app.created_at).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                        {allianceApps.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-bold uppercase tracking-widest text-sm">
                                                    No applications received yet.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : view === 'add' ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-4xl mx-auto">
                            <h3 className="text-lg font-bold text-[#2D1B4E] mb-6">{editingId ? 'Edit Product' : 'Add New Product'}</h3>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">Product Name</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-[#8E2A8B] focus:border-[#8E2A8B] outline-none transition-all"
                                            placeholder="Product Name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-sm font-bold text-gray-700">Price (₹)</label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id="isCustomRequest"
                                                    checked={formData.isCustomRequest}
                                                    onChange={e => setFormData({ ...formData, isCustomRequest: e.target.checked, price: e.target.checked ? '0' : formData.price })}
                                                    className="w-4 h-4 rounded text-[#8E2A8B] focus:ring-[#8E2A8B] border-gray-300"
                                                />
                                                <label htmlFor="isCustomRequest" className="text-xs font-bold text-[#8E2A8B] cursor-pointer select-none">
                                                    Use Customization Form
                                                </label>
                                            </div>
                                        </div>
                                        <input
                                            type="number"
                                            value={formData.price}
                                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                                            className={`w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-[#8E2A8B] focus:border-[#8E2A8B] outline-none transition-all ${formData.isCustomRequest ? 'bg-gray-100 text-gray-400' : ''}`}
                                            placeholder="0.00"
                                            disabled={formData.isCustomRequest || isUploading}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">Category</label>
                                        <select
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-[#8E2A8B] focus:border-[#8E2A8B] outline-none transition-all bg-white text-sm font-medium"
                                        >
                                            <option value="" disabled>Select a category</option>
                                            {categories.filter(c => !c.parent).map(topCat => {
                                                const renderOptions = (parentSlug: string, level: number = 0) => {
                                                    const children = categories.filter(c => c.parent === parentSlug);
                                                    return children.map(child => (
                                                        <Fragment key={child.slug}>
                                                            <option value={child.slug}>
                                                                {'\u00A0'.repeat(level * 4)}{level > 0 ? '↳ ' : ''}{child.name}
                                                            </option>
                                                            {renderOptions(child.slug, level + 1)}
                                                        </Fragment>
                                                    ));
                                                };

                                                return (
                                                    <optgroup key={topCat.slug} label={topCat.name.toUpperCase()}>
                                                        <option value={topCat.slug}>General {topCat.name}</option>
                                                        {renderOptions(topCat.slug, 1)}
                                                    </optgroup>
                                                );
                                            })}
                                        </select>
                                    </div>
                                    <div className="col-span-1 md:col-span-2 flex items-center gap-6 pt-2">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                id="isBestSeller"
                                                checked={formData.isBestSeller}
                                                onChange={e => setFormData({ ...formData, isBestSeller: e.target.checked })}
                                                className="w-5 h-5 rounded text-[#8E2A8B] focus:ring-[#8E2A8B] border-gray-300"
                                            />
                                            <label htmlFor="isBestSeller" className="text-sm font-bold text-gray-700 select-none cursor-pointer">
                                                Mark as Best Seller (Show on Home Page)
                                            </label>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                id="isGiftBundleItem"
                                                checked={formData.isGiftBundleItem}
                                                onChange={e => setFormData({ ...formData, isGiftBundleItem: e.target.checked })}
                                                className="w-5 h-5 rounded text-[#8E2A8B] focus:ring-[#8E2A8B] border-gray-300"
                                            />
                                            <label htmlFor="isGiftBundleItem" className="text-sm font-bold text-gray-700 select-none cursor-pointer">
                                                Add to Gift Bundle
                                            </label>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                id="isLive"
                                                checked={formData.isLive}
                                                onChange={e => setFormData({ ...formData, isLive: e.target.checked })}
                                                className="w-5 h-5 rounded text-[#8E2A8B] focus:ring-[#8E2A8B] border-gray-300"
                                            />
                                            <label htmlFor="isLive" className="text-sm font-bold text-[#8E2A8B] select-none cursor-pointer">
                                                Live Status (Published to Site)
                                            </label>
                                        </div>
                                    </div>

                                    {/* Affiliate Marketing Settings */}
                                    <div className="col-span-1 md:col-span-2 bg-purple-50/50 p-6 rounded-2xl border border-purple-100 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                                                    <Handshake size={20} />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-[#2D1B4E]">Affiliate Marketing Settings</h4>
                                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Configure commissions for brand ambassadors</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-purple-100">
                                                <input
                                                    type="checkbox"
                                                    id="is_affiliate_eligible"
                                                    checked={formData.is_affiliate_eligible}
                                                    onChange={e => setFormData({ ...formData, is_affiliate_eligible: e.target.checked })}
                                                    className="w-5 h-5 rounded text-[#8E2A8B] focus:ring-[#8E2A8B] border-gray-300"
                                                />
                                                <label htmlFor="is_affiliate_eligible" className="text-sm font-black text-purple-700 select-none cursor-pointer">
                                                    Eligible for Affiliate Program
                                                </label>
                                            </div>
                                        </div>

                                        {formData.is_affiliate_eligible && (
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Payout Type</label>
                                                    <select
                                                        value={formData.affiliate_payout_type}
                                                        onChange={e => setFormData({ ...formData, affiliate_payout_type: e.target.value as any })}
                                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-[#8E2A8B] focus:border-[#8E2A8B] outline-none transition-all bg-white font-bold text-sm"
                                                    >
                                                        <option value="percentage">Percentage (%)</option>
                                                        <option value="fixed">Fixed Amount (₹)</option>
                                                    </select>
                                                </div>

                                                {formData.affiliate_payout_type === 'percentage' ? (
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Commission Rate (%)</label>
                                                        <div className="relative">
                                                            <input
                                                                type="number"
                                                                value={formData.affiliate_commission_rate}
                                                                onChange={e => setFormData({ ...formData, affiliate_commission_rate: e.target.value })}
                                                                className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-10 focus:ring-[#8E2A8B] focus:border-[#8E2A8B] outline-none transition-all font-bold"
                                                                placeholder="10"
                                                            />
                                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Fixed Amount (₹)</label>
                                                        <div className="relative">
                                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</div>
                                                            <input
                                                                type="number"
                                                                value={formData.affiliate_fixed_amount}
                                                                onChange={e => setFormData({ ...formData, affiliate_fixed_amount: e.target.value })}
                                                                className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-3 focus:ring-[#8E2A8B] focus:border-[#8E2A8B] outline-none transition-all font-bold"
                                                                placeholder="100"
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="bg-white p-4 rounded-2xl border border-purple-100 flex items-center gap-4 group">
                                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                                        <DollarSign size={20} />
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Estimated Payout</div>
                                                        <div className="text-lg font-black text-[#2D1B4E] leading-tight">
                                                            ₹{formData.affiliate_payout_type === 'percentage' 
                                                                ? ((parseFloat(formData.price || '0') * parseFloat(formData.affiliate_commission_rate || '0')) / 100).toFixed(2)
                                                                : parseFloat(formData.affiliate_fixed_amount || '0').toFixed(2)
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {formData.is_affiliate_eligible && (
                                            <div className="pt-4 border-t border-purple-100/50">
                                                <div className="space-y-4">
                                                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                                                        <div className="flex-1 space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Minimum Achievement Level Required</label>
                                                                <div className="flex items-center gap-2 text-purple-400 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                                                                    <Activity size={10} />
                                                                    <span className="text-[9px] font-black uppercase tracking-tighter">Visibility Control</span>
                                                                </div>
                                                            </div>
                                                            <p className="text-[10px] text-gray-400 italic font-medium">Only affiliates at this level or higher will see this product in their portal.</p>
                                                            <select
                                                                value={formData.min_affiliate_level}
                                                                onChange={e => setFormData({ ...formData, min_affiliate_level: e.target.value })}
                                                                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-[#8E2A8B] focus:border-[#8E2A8B] outline-none transition-all bg-white font-bold text-sm shadow-sm hover:border-[#8E2A8B] cursor-pointer"
                                                            >
                                                                <option value="Kottravai Ambassador">Kottravai Ambassador</option>
                                                                <option value="Kottravai Seller">Kottravai Seller</option>
                                                                <option value="Kottravai Pro Partner">Kottravai Pro Partner</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Custom Form Builder - Table View */}
                                    {formData.isCustomRequest && (
                                        <div className="col-span-1 md:col-span-2 bg-white p-6 rounded-lg border border-gray-200">
                                            <div className="flex justify-between items-center mb-4">
                                                <h4 className="font-bold text-[#2D1B4E] text-lg">Custom Form Fields</h4>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({
                                                        ...prev,
                                                        customFormConfig: [...prev.customFormConfig, { id: Date.now().toString(), label: '', type: 'text', placeholder: '', required: true }]
                                                    }))}
                                                    className="bg-[#2D1B4E] text-white px-4 py-2 rounded-lg hover:bg-[#8E2A8B] transition flex items-center gap-2"
                                                >
                                                    <Plus size={16} />
                                                    Add Field
                                                </button>
                                            </div>

                                            <div className="overflow-x-auto">
                                                <table className="w-full border-collapse">
                                                    <thead>
                                                        <tr className="bg-gray-50 border-b-2 border-gray-200">
                                                            <th className="text-left px-4 py-3 font-bold text-sm text-gray-700">Field Label</th>
                                                            <th className="text-left px-4 py-3 font-bold text-sm text-gray-700">Placeholder Text</th>
                                                            <th className="text-left px-4 py-3 font-bold text-sm text-gray-700">Field Type</th>
                                                            <th className="text-center px-4 py-3 font-bold text-sm text-gray-700">Required</th>
                                                            <th className="text-center px-4 py-3 font-bold text-sm text-gray-700">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {/* Default Fields - Now Editable */}
                                                        {formData.defaultFormFields.map((field, index) => (
                                                            <tr key={field.id} className="border-b border-gray-100 bg-gray-50/50 hover:bg-gray-100/50 transition">
                                                                <td className="px-4 py-3">
                                                                    <input
                                                                        type="text"
                                                                        value={field.label}
                                                                        onChange={(e) => {
                                                                            const newFields = [...formData.defaultFormFields];
                                                                            newFields[index].label = e.target.value;
                                                                            setFormData({ ...formData, defaultFormFields: newFields });
                                                                        }}
                                                                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#8E2A8B] focus:border-[#8E2A8B] outline-none bg-white"
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <input
                                                                        type="text"
                                                                        value={field.placeholder}
                                                                        onChange={(e) => {
                                                                            const newFields = [...formData.defaultFormFields];
                                                                            newFields[index].placeholder = e.target.value;
                                                                            setFormData({ ...formData, defaultFormFields: newFields });
                                                                        }}
                                                                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#8E2A8B] focus:border-[#8E2A8B] outline-none bg-white"
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <select
                                                                        value={field.type}
                                                                        onChange={(e) => {
                                                                            const newFields = [...formData.defaultFormFields];
                                                                            newFields[index].type = e.target.value as any;
                                                                            setFormData({ ...formData, defaultFormFields: newFields });
                                                                        }}
                                                                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#8E2A8B] focus:border-[#8E2A8B] outline-none bg-white"
                                                                    >
                                                                        <option value="text">Text</option>
                                                                        <option value="email">Email</option>
                                                                        <option value="tel">Phone</option>
                                                                        <option value="file">File Upload</option>
                                                                        <option value="textarea">Long Text</option>
                                                                        <option value="number">Number</option>
                                                                    </select>
                                                                </td>
                                                                <td className="px-4 py-3 text-center">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={field.required}
                                                                        onChange={(e) => {
                                                                            const newFields = [...formData.defaultFormFields];
                                                                            newFields[index].required = e.target.checked;
                                                                            setFormData({ ...formData, defaultFormFields: newFields });
                                                                        }}
                                                                        className="w-4 h-4 rounded text-[#8E2A8B] focus:ring-[#8E2A8B] border-gray-300"
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-3 text-center">
                                                                    <span className="text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded">Default</span>
                                                                </td>
                                                            </tr>
                                                        ))}

                                                        {/* Custom Fields - Editable */}
                                                        {formData.customFormConfig.map((field, index) => (
                                                            <tr key={field.id} className="border-b border-gray-100 hover:bg-blue-50/30 transition">
                                                                <td className="px-4 py-3">
                                                                    <input
                                                                        type="text"
                                                                        value={field.label}
                                                                        onChange={(e) => {
                                                                            const newConfig = [...formData.customFormConfig];
                                                                            newConfig[index].label = e.target.value;
                                                                            setFormData({ ...formData, customFormConfig: newConfig });
                                                                        }}
                                                                        placeholder="e.g., Size, Color"
                                                                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#8E2A8B] focus:border-[#8E2A8B] outline-none"
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <input
                                                                        type="text"
                                                                        value={field.placeholder || ''}
                                                                        onChange={(e) => {
                                                                            const newConfig = [...formData.customFormConfig];
                                                                            newConfig[index].placeholder = e.target.value;
                                                                            setFormData({ ...formData, customFormConfig: newConfig });
                                                                        }}
                                                                        placeholder="Enter placeholder text"
                                                                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#8E2A8B] focus:border-[#8E2A8B] outline-none"
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <select
                                                                        value={field.type}
                                                                        onChange={(e) => {
                                                                            const newConfig = [...formData.customFormConfig];
                                                                            newConfig[index].type = e.target.value as any;
                                                                            setFormData({ ...formData, customFormConfig: newConfig });
                                                                        }}
                                                                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#8E2A8B] focus:border-[#8E2A8B] outline-none bg-white"
                                                                    >
                                                                        <option value="text">Text</option>
                                                                        <option value="textarea">Long Text</option>
                                                                        <option value="number">Number</option>
                                                                    </select>
                                                                </td>
                                                                <td className="px-4 py-3 text-center">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={field.required !== false}
                                                                        onChange={(e) => {
                                                                            const newConfig = [...formData.customFormConfig];
                                                                            newConfig[index].required = e.target.checked;
                                                                            setFormData({ ...formData, customFormConfig: newConfig });
                                                                        }}
                                                                        className="w-4 h-4 rounded text-[#8E2A8B] focus:ring-[#8E2A8B] border-gray-300"
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-3 text-center">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const newConfig = formData.customFormConfig.filter((_, i) => i !== index);
                                                                            setFormData({ ...formData, customFormConfig: newConfig });
                                                                        }}
                                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded transition"
                                                                        title="Delete field"
                                                                    >
                                                                        <Trash2 size={18} />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {formData.customFormConfig.length === 0 && (
                                                <p className="text-sm text-gray-400 italic text-center py-4 bg-gray-50 rounded mt-4">
                                                    No custom fields added. Default fields (Name, Email, Phone, Image) will be used.
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Product Variants Section */}
                                    <div className="space-y-4 pt-6 border-t border-gray-100">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h4 className="text-md font-bold text-[#2D1B4E]">Product Variants (Weight-based)</h4>
                                                <p className="text-xs text-gray-500">Add different weights, prices, and images for this product.</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({
                                                    ...prev,
                                                    variants: [...prev.variants, { weight: '', price: 0, images: [] }]
                                                }))}
                                                className="bg-[#2D1B4E] text-white px-4 py-2 rounded-lg hover:bg-[#8E2A8B] transition flex items-center gap-2 text-sm font-bold"
                                            >
                                                <Plus size={16} />
                                                Add Variant
                                            </button>
                                        </div>

                                        {formData.variants.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {formData.variants.map((variant, index) => (
                                                    <div key={index} className="bg-gray-50 p-4 rounded-xl border border-gray-200 relative group">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newVariants = formData.variants.filter((_, i) => i !== index);
                                                                setFormData({ ...formData, variants: newVariants });
                                                            }}
                                                            className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-1">
                                                                <label className="text-xs font-bold text-gray-700">Weight / Size</label>
                                                                <input
                                                                    type="text"
                                                                    value={variant.weight}
                                                                    onChange={(e) => {
                                                                        const newVariants = [...formData.variants];
                                                                        newVariants[index].weight = e.target.value;
                                                                        setFormData({ ...formData, variants: newVariants });
                                                                    }}
                                                                    placeholder="e.g. 500g, 1kg"
                                                                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-[#8E2A8B] focus:border-[#8E2A8B] outline-none"
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label className="text-xs font-bold text-gray-700">Price (₹)</label>
                                                                <input
                                                                    type="number"
                                                                    value={variant.price || ''}
                                                                    onChange={(e) => {
                                                                        const newVariants = [...formData.variants];
                                                                        newVariants[index].price = parseFloat(e.target.value);
                                                                        setFormData({ ...formData, variants: newVariants });
                                                                    }}
                                                                    placeholder="Price"
                                                                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-[#8E2A8B] focus:border-[#8E2A8B] outline-none"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="mt-3 space-y-1">
                                                            <label className="text-xs font-bold text-gray-700">Variant Images</label>
                                                            <div className="flex flex-wrap gap-2 mb-2">
                                                                {(variant.images || []).map((img, imgIdx) => (
                                                                    <div key={imgIdx} className="relative w-10 h-10 rounded border border-gray-300 overflow-hidden group/img">
                                                                        <img src={img} className="w-full h-full object-cover" />
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const newVariants = [...formData.variants];
                                                                                newVariants[index].images = newVariants[index].images.filter((_, i) => i !== imgIdx);
                                                                                setFormData({ ...formData, variants: newVariants });
                                                                            }}
                                                                            className="absolute top-0 right-0 bg-red-500 text-white p-0.5 opacity-0 group-hover/img:opacity-100"
                                                                        >
                                                                            <X size={8} />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <label className="cursor-pointer bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded text-[10px] font-bold hover:bg-gray-50 transition-colors inline-block uppercase tracking-wider">
                                                                Upload Images
                                                                <input
                                                                    type="file"
                                                                    multiple
                                                                    className="hidden"
                                                                    accept="image/*"
                                                                    onChange={async (e) => {
                                                                        const files = e.target.files;
                                                                        if (files) {
                                                                            setIsUploading(true);
                                                                            const loadToast = toast.loading("Uploading variant images...");
                                                                            try {
                                                                                const uploadedUrls = await Promise.all(
                                                                                    Array.from(files).map(file => uploadToSupabase(file, 'variants'))
                                                                                );
                                                                                
                                                                                const newVariants = [...formData.variants];
                                                                                newVariants[index].images = [...(newVariants[index].images || []), ...uploadedUrls];
                                                                                setFormData({ ...formData, variants: newVariants });
                                                                                toast.success("Images uploaded", { id: loadToast });
                                                                            } catch (err: any) {
                                                                                toast.error("Upload failed: " + err.message, { id: loadToast });
                                                                            } finally {
                                                                                setIsUploading(false);
                                                                            }
                                                                        }
                                                                    }}
                                                                />
                                                            </label>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                                <p className="text-sm text-gray-500 italic">No weight variants added. Default price and images will be used.</p>
                                            </div>
                                        )}
                                    </div>

                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Short Description</label>
                                    <input
                                        type="text"
                                        value={formData.shortDescription}
                                        onChange={e => setFormData({ ...formData, shortDescription: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-[#8E2A8B] focus:border-[#8E2A8B] outline-none transition-all"
                                        placeholder="Brief summary used in cards"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Full Description</label>
                                    <textarea
                                        rows={4}
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-[#8E2A8B] focus:border-[#8E2A8B] outline-none transition-all"
                                        placeholder="Detailed description..."
                                    ></textarea>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">Key Features (One per line)</label>
                                        <textarea
                                            rows={4}
                                            value={formData.keyFeatures}
                                            onChange={e => setFormData({ ...formData, keyFeatures: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-[#8E2A8B] focus:border-[#8E2A8B] outline-none transition-all"
                                            placeholder="- Feature 1&#10;- Feature 2"
                                        ></textarea>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">Specifications (One per line)</label>
                                        <textarea
                                            rows={4}
                                            value={formData.specifications}
                                            onChange={e => setFormData({ ...formData, specifications: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-[#8E2A8B] focus:border-[#8E2A8B] outline-none transition-all"
                                            placeholder="- Spec 1&#10;- Spec 2"
                                        ></textarea>
                                    </div>
                                </div>

                                {/* Image Uploads */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">Main Image</label>
                                        <div className="flex items-center gap-4">
                                            {mainImage && (
                                                <div className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                                                    <img src={mainImage} alt="Main" className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            <label className="cursor-pointer bg-purple-50 hover:bg-purple-100 text-[#8E2A8B] px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2">
                                                <Upload size={16} />
                                                Upload Cover
                                                <input type="file" className="hidden" accept="image/*" onChange={handleMainImageUpload} />
                                            </label>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">Gallery Images</label>
                                        <div className="space-y-3">
                                            <div className="flex flex-wrap gap-2">
                                                {otherImages.map((img, idx) => (
                                                    <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 group">
                                                        <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeOtherImage(idx)}
                                                            className="absolute top-0 right-0 bg-red-500 text-white p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                            <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold transition-colors inline-flex items-center gap-2">
                                                <Upload size={16} />
                                                Add Images
                                                <input type="file" multiple className="hidden" accept="image/*" onChange={handleOtherImagesUpload} />
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => { setView('list'); resetForm(); }}
                                        disabled={isUploading}
                                        className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isUploading}
                                        className="px-6 py-2.5 bg-[#2D1B4E] text-white rounded-lg font-bold hover:bg-[#8E2A8B] transition-colors shadow-lg disabled:bg-gray-400 flex items-center gap-2"
                                    >
                                        {isUploading ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                Saving...
                                            </>
                                        ) : (
                                            editingId ? 'Save Changes' : 'Create Product'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : view === 'stocks' ? (
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-[#2D1B4E] text-white">
                                        <tr>
                                            <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Product</th>
                                            <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Current Stock</th>
                                            <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Update Stock</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {products.map(product => (
                                            <tr key={product.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden">
                                                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                                        </div>
                                                        <span className="font-medium text-gray-900">{product.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${product.stock && product.stock > 10 ? 'bg-green-100 text-green-700' : product.stock && product.stock > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                                        {product.stock || 0} units
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => updateStock(product.id, Math.max(0, (product.stock || 0) - 1))}
                                                            className="p-1.5 rounded-lg bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-600 transition-colors"
                                                        >
                                                            <ChevronDown size={16} />
                                                        </button>
                                                        <span className="w-8 text-center font-bold">{product.stock || 0}</span>
                                                        <button
                                                            onClick={() => updateStock(product.id, (product.stock || 0) + 1)}
                                                            className="p-1.5 rounded-lg bg-gray-100 hover:bg-green-100 text-gray-600 hover:text-green-600 transition-colors"
                                                        >
                                                            <ChevronUp size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : view === 'users' ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                    <h4 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Total Customers</h4>
                                    <p className="text-3xl font-bold text-[#2D1B4E]">{customers.length}</p>
                                </div>
                                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                    <h4 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Average LTV</h4>
                                    <p className="text-3xl font-bold text-blue-600">
                                        ₹{customers.length > 0 ? (customers.reduce((acc, c) => acc + c.totalSpent, 0) / customers.length).toFixed(2) : 0}
                                    </p>
                                </div>
                                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                    <h4 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Repeat Customers</h4>
                                    <p className="text-3xl font-bold text-purple-600">{customers.filter(c => c.orderCount > 1).length}</p>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-[#2D1B4E] text-white">
                                        <tr>
                                            <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Customer Name</th>
                                            <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Email/Phone</th>
                                            <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Orders</th>
                                            <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Total Spent</th>
                                            <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Last Order</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {customers.sort((a, b) => b.totalSpent - a.totalSpent).map((customer, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className="font-bold text-gray-800">{customer.name}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm text-gray-600">{customer.email}</span>
                                                        <span className="text-xs text-gray-400">{customer.phone}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="bg-purple-50 text-[#8E2A8B] px-3 py-1 rounded-full text-xs font-bold">
                                                        {customer.orderCount} Orders
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-bold text-gray-900">₹{customer.totalSpent.toLocaleString()}</td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {new Date(customer.lastOrder).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                        {customers.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-10 text-center text-gray-400 italic">No customer data available yet.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : view === 'orders' ? (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-[#2D1B4E]">Orders Management</h3>
                                <button
                                    onClick={() => generateInvoice({
                                        id: 'SAMPLE-123',
                                        date: new Date().toISOString(),
                                        customerName: 'Sample Customer',
                                        customerEmail: 'customer@example.com',
                                        customerPhone: '+91 9876543210',
                                        address: '123, Sample Street, Test City',
                                        city: 'Chennai',
                                        state: 'Tamil Nadu',
                                        pincode: '600001',
                                        total: 5000,
                                        items: [
                                            { name: 'Kottravai Premium Product', quantity: 1, price: 4500 },
                                            { name: 'Heritage Collection Item', quantity: 2, price: 250 }
                                        ],
                                        shipping_server: 0
                                    })}
                                    className="bg-[#8E2A8B] text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-[#2D1B4E] transition-all flex items-center gap-2 shadow-md"
                                >
                                    <FileText size={18} />
                                    Generate Sample Invoice
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                    <h4 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Total Orders</h4>
                                    <p className="text-3xl font-bold text-[#2D1B4E]">{orders.length}</p>
                                </div>
                                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                    <h4 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Pending Processing</h4>
                                    <p className="text-3xl font-bold text-orange-500">{orders.filter(o => o.status === 'Pending').length}</p>
                                </div>
                                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                    <h4 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Total Revenue</h4>
                                    <p className="text-3xl font-bold text-green-600">₹{orders.reduce((acc, curr) => acc + curr.total, 0).toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-[#2D1B4E] text-white">
                                        <tr>
                                            <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Order ID</th>
                                            <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Customer</th>
                                            <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Items</th>
                                            <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Total</th>
                                            <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {orders.map(order => (
                                            <tr key={order.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 font-medium text-gray-900">
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-[#2D1B4E]">#{order.id.slice(0, 8).toUpperCase()}</span>
                                                        {order.orderId && <span className="text-[10px] text-gray-400 font-bold">RPAY: {order.orderId}</span>}
                                                        {order.shiprocketOrderId && (
                                                            <div className="mt-1 flex flex-col gap-0.5">
                                                                <span className="text-[10px] text-[#8E2A8B] font-black uppercase tracking-tighter">🚀 SR ID: {order.shiprocketOrderId}</span>
                                                                {order.shipmentId && <span className="text-[9px] text-gray-500 font-bold">SHP: {order.shipmentId}</span>}
                                                                {order.zoneName && <span className="text-[9px] text-[#8E2A8B]/60 font-black italic">Zone: {order.zoneName}</span>}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-gray-900">{order.customerName}</span>
                                                        <span className="text-xs text-gray-500">{order.customerEmail}</span>
                                                        <div className="flex flex-col mt-1 space-y-0.5">
                                                            {order.customerPhone && <span className="text-[10px] text-gray-400">📞 {order.customerPhone}</span>}
                                                            {order.address && <span className="text-[10px] text-gray-400 truncate max-w-[200px]" title={order.address}>🏠 {order.address}</span>}
                                                            {order.city && <span className="text-[10px] text-gray-400">📍 {order.city}, {order.pincode}</span>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        {Array.isArray(order.items) ? order.items.map((item: any, idx: number) => (
                                                            <div key={idx} className="flex items-center gap-2 text-xs">
                                                                <span className="font-bold text-gray-800">{item.quantity}x</span>
                                                                <span className="text-gray-600 truncate max-w-[150px]" title={item.name}>{item.name}</span>
                                                            </div>
                                                        )) : <span className="text-gray-400 italic text-xs">No items</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">{new Date(order.date).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 font-bold text-[#8E2A8B]">₹{order.total}</td>
                                                <td className="px-6 py-4">
                                                    <select
                                                        value={order.status}
                                                        onChange={(e) => updateOrderStatus(order.id, e.target.value as any)}
                                                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border-0 cursor-pointer focus:ring-2 focus:ring-offset-1 focus:ring-[#8E2A8B] ${order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                                                            order.status === 'Shipped' ? 'bg-blue-100 text-blue-700' :
                                                                order.status === 'Processing' ? 'bg-yellow-100 text-yellow-700' :
                                                                    'bg-gray-100 text-gray-700'
                                                            }`}
                                                    >
                                                        <option value="Pending">Pending</option>
                                                        <option value="Processing">Processing</option>
                                                        <option value="Shipped">Shipped</option>
                                                        <option value="Delivered">Delivered</option>
                                                        <option value="Cancelled">Cancelled</option>
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => generateInvoice(order)}
                                                            className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1"
                                                            title="Download Invoice"
                                                        >
                                                            <FileText size={18} />
                                                            <span className="text-[10px] font-bold">Invoice</span>
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                if (window.confirm(`Delete order #${order.id.slice(0, 8)}?`)) {
                                                                    deleteOrder(order.id);
                                                                    toast.success("Order deleted");
                                                                }
                                                            }}
                                                            className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete Order"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {orders.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-10 text-center text-gray-400">No orders found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : view === 'whatsapp-helper' ? (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                                <h3 className="text-xl font-bold text-[#2D1B4E] mb-2 flex items-center gap-2">
                                    <MessageCircle className="text-[#25D366]" size={24} />
                                    WhatsApp Catalog Assistant
                                </h3>
                                <p className="text-gray-500 text-sm mb-6">
                                    Use this tool to quickly sync your website products with your <b>WhatsApp Business App</b>.
                                    Copy the description and link below, then paste them into your WhatsApp catalog.
                                </p>

                                {Object.entries(products.reduce((acc: any, product) => {
                                    const category = product.category || 'Uncategorized';
                                    if (!acc[category]) acc[category] = [];
                                    acc[category].push(product);
                                    return acc;
                                }, {})).map(([category, items]: [string, any]) => (
                                    <div key={category} className="mb-10 animate-in fade-in duration-700">
                                        <div className="flex items-center gap-3 mb-4 pl-1">
                                            <div className="h-6 w-1 bg-[#25D366] rounded-full"></div>
                                            <h4 className="text-lg font-black text-gray-700 uppercase tracking-widest">{category}</h4>
                                            <span className="text-xs font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-md">{items.length} Items</span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {items.map((product: any) => (
                                                <div key={product.id} className="bg-gray-50 rounded-2xl p-5 border border-gray-100 hover:shadow-md transition-all group">
                                                    <div className="flex gap-4 mb-4">
                                                        <div className="relative">
                                                            <img src={product.image} className="w-16 h-16 rounded-xl object-cover shadow-sm group-hover:scale-105 transition-transform" alt="" />
                                                            <div className="absolute -top-2 -left-2 bg-white rounded-full p-1 shadow-sm border border-gray-100">
                                                                <MessageCircle size={12} className="text-[#25D366]" />
                                                            </div>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-bold text-[#2D1B4E] truncate text-sm">{product.name}</h4>
                                                            <p className="text-sm font-black text-[#8E2A8B] mt-0.5">₹{product.price}</p>
                                                            <p className="text-[10px] text-gray-400 mt-1 truncate">ID: {product.id.slice(0, 6)}...</p>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <button
                                                            onClick={() => {
                                                                const desc = `✨ *${product.name}*\n\n` +
                                                                    `📦 *Category:* ${product.category}\n` +
                                                                    `💰 *Price:* ₹${product.price}\n\n` +
                                                                    `📝 *Details:* \n${(product.shortDescription || product.description || '').slice(0, 150)}...\n\n` +
                                                                    `✅ Authentic Handcrafted Quality\n` +
                                                                    `✅ Sustainable & Eco-friendly\n\n` +
                                                                    `🛍️ Order Now via the link below!`;
                                                                navigator.clipboard.writeText(desc);
                                                                toast.success('Description Copied!');
                                                            }}
                                                            className="w-full flex items-center justify-center gap-2 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold hover:bg-[#25D366] hover:text-white hover:border-[#25D366] transition-all"
                                                        >
                                                            Copy Description
                                                        </button>

                                                        <button
                                                            onClick={() => {
                                                                const url = `${window.location.origin}/product/${product.slug}`;
                                                                navigator.clipboard.writeText(url);
                                                                toast.success('Product Link Copied!');
                                                            }}
                                                            className="w-full flex items-center justify-center gap-2 py-2 bg-[#2D1B4E] text-white rounded-lg text-xs font-bold hover:bg-black transition-colors"
                                                        >
                                                            <ArrowUpRight size={14} />
                                                            Copy Site Link
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : view === 'affiliate-withdrawals' ? (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Left Side: Record Manual Payout */}
                                <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                    <h4 className="text-sm font-black text-[#2D1B4E] uppercase tracking-widest flex items-center gap-2">
                                        <Plus size={16} className="text-[#8E2A8B]" />
                                        Manual Payout Entry
                                    </h4>
                                    <form 
                                        onSubmit={async (e) => {
                                            e.preventDefault();
                                            const form = e.target as HTMLFormElement;
                                            const data = new FormData(form);
                                            const payload = {
                                                affiliate_id: data.get('affiliate_id'),
                                                amount: data.get('amount'),
                                                paymentMethod: data.get('method'),
                                                paymentDetails: data.get('details'),
                                                status: 'paid' // Manual entries are usually already paid
                                            };
                                            
                                            try {
                                                const adminSecret = sessionStorage.getItem('kottravai_admin_token') || 'admin123';
                                                const res = await axios.post(`${import.meta.env.VITE_API_URL || '/api'}/affiliates/admin/withdrawals/manual`, payload, {
                                                    headers: { 'X-Admin-Secret': adminSecret }
                                                });
                                                if (res.data.success) {
                                                    toast.success('Manual payout logged successfully');
                                                    form.reset();
                                                    fetchWithdrawals();
                                                }
                                            } catch (err: any) {
                                                toast.error(err.response?.data?.error || 'Failed to record payout');
                                            }
                                        }}
                                        className="space-y-3"
                                    >
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase">Select Partner</label>
                                            <select name="affiliate_id" required className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-[#8E2A8B]/10 transition-all">
                                                <option value="">-- Choose Affiliate --</option>
                                                {activeAffiliates.map(a => (
                                                    <option key={a.id} value={a.id}>{a.name} ({a.email})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase">Amount (₹)</label>
                                            <input name="amount" type="number" step="1" required className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm font-bold outline-none" placeholder="0.00" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase">Method</label>
                                                <select name="method" required className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm font-bold outline-none">
                                                    <option value="UPI">UPI</option>
                                                    <option value="Bank Transfer">Bank Transfer</option>
                                                    <option value="Cash">Cash</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase">Reference</label>
                                                <input name="details" required className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm font-bold outline-none" placeholder="UTR / UPI ID" />
                                            </div>
                                        </div>
                                        <button className="w-full bg-[#2D1B4E] text-white py-2.5 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-[#8E2A8B] transition-all shadow-md">
                                            Log Transaction
                                        </button>
                                    </form>
                                </div>

                                {/* Right Side: Header Info */}
                                <div className="lg:col-span-2 bg-gradient-to-br from-[#8E2A8B] to-[#2D1B4E] p-8 rounded-2xl shadow-xl flex flex-col justify-center text-white relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-10 opacity-10">
                                        <DollarSign size={120} />
                                    </div>
                                    <h2 className="text-3xl font-black mb-2">Financial Nexus</h2>
                                    <p className="text-white/70 max-w-md">Real-time monitoring of affiliate payouts. Log manual transactions or approve pending requests from ambassadors.</p>
                                    <div className="flex gap-4 mt-6">
                                        <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                                            <p className="text-[10px] font-bold uppercase text-white/50">Total Logs</p>
                                            <p className="text-xl font-black">{withdrawals.length}</p>
                                        </div>
                                        <button 
                                            onClick={fetchWithdrawals}
                                            className="px-4 py-2 bg-white text-[#2D1B4E] rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-100 transition-all flex items-center gap-2"
                                        >
                                            <Activity size={16} />
                                            Sync Data
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-[#f8f9fc] border-b border-gray-100">
                                        <tr>
                                            <th className="px-6 py-4 font-bold text-[10px] text-gray-400 uppercase tracking-widest">Partner</th>
                                            <th className="px-6 py-4 font-bold text-[10px] text-gray-400 uppercase tracking-widest">Amount</th>
                                            <th className="px-6 py-4 font-bold text-[10px] text-gray-400 uppercase tracking-widest">Strategy/Method</th>
                                            <th className="px-6 py-4 font-bold text-[10px] text-gray-400 uppercase tracking-widest">Status</th>
                                            <th className="px-6 py-4 font-bold text-[10px] text-gray-400 uppercase tracking-widest">Processed</th>
                                            <th className="px-6 py-4 font-bold text-[10px] text-gray-400 uppercase tracking-widest text-right">Operations</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {withdrawals.map((w: any) => (
                                            <tr key={w.id} className="hover:bg-gray-50/50 transition-colors group">
                                                <td className="px-6 py-5">
                                                    <div className="font-bold text-gray-800">{w.affiliate_name}</div>
                                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">{w.affiliate_email}</div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className="text-lg font-black text-[#8E2A8B]">₹{parseFloat(w.amount).toLocaleString()}</span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-2 py-1 bg-gray-100 rounded text-[10px] font-black text-gray-600 uppercase tracking-widest">{w.payment_method}</span>
                                                    </div>
                                                    <div className="text-[11px] text-gray-500 mt-1.5 font-medium max-w-xs truncate" title={w.payment_details}>
                                                        {w.payment_details}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                        w.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                                                        w.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                                                        w.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                                                        'bg-amber-100 text-amber-700 animate-pulse'
                                                    }`}>
                                                        {w.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-2 text-gray-400">
                                                        <Clock size={12} />
                                                        <span className="text-[11px] font-bold">
                                                            {w.processed_at ? new Date(w.processed_at).toLocaleDateString() : 'Awaiting Flow'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <div className="flex justify-end items-center gap-2">
                                                        {w.status === 'pending' && (
                                                            <>
                                                                <button 
                                                                    onClick={() => updateWithdrawalStatus(w.id, 'approved')}
                                                                    className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all"
                                                                >
                                                                    Approve
                                                                </button>
                                                                <button 
                                                                    onClick={() => {
                                                                        const notes = window.prompt('Specify reason for rejection:');
                                                                        if (notes !== null) updateWithdrawalStatus(w.id, 'rejected', notes);
                                                                    }}
                                                                    className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all"
                                                                >
                                                                    Kill Flow
                                                                </button>
                                                            </>
                                                        )}
                                                        {w.status === 'approved' && (
                                                            <button 
                                                                onClick={() => updateWithdrawalStatus(w.id, 'paid')}
                                                                className="px-6 py-1.5 bg-emerald-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 shadow-sm transition-all"
                                                            >
                                                                Finalize Payout
                                                            </button>
                                                        )}
                                                        {(w.status === 'paid' || w.status === 'rejected') && (
                                                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Archived</span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {withdrawals.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-20 text-center">
                                                    <div className="flex flex-col items-center gap-2 grayscale opacity-50">
                                                        <DollarSign size={40} className="text-gray-300" />
                                                        <p className="text-sm font-bold text-gray-400">No withdrawal requests found in logs.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white">
                                <h3 className="text-xl font-bold text-[#2D1B4E] flex items-center gap-2">
                                    <Package size={22} className="text-[#8E2A8B]" />
                                    Inventory Catalog
                                </h3>
                                <div className="flex flex-wrap items-center gap-4">
                                    {/* Status Toggle */}
                                    <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
                                        {(['all', 'live', 'draft'] as const).map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => setStatusFilter(s)}
                                                className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                                                    statusFilter === s 
                                                    ? 'bg-[#2D1B4E] text-white shadow-md' 
                                                    : 'text-gray-500 hover:text-[#2D1B4E]'
                                                }`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Search */}
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Search items..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-200 outline-none w-48 transition-all focus:w-64"
                                        />
                                    </div>

                                    {/* Category Select */}
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        className="border border-gray-200 bg-gray-50 rounded-lg px-4 py-2 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-purple-200 outline-none"
                                    >
                                        <option value="all">Categories: All</option>
                                        {categories.filter(c => !c.parent).map(parent => {
                                            const renderSubOptions = (parentSlug: string, depth: number = 0): React.ReactNode => {
                                                return categories
                                                    .filter(c => c.parent === parentSlug)
                                                    .map(sub => (
                                                        <Fragment key={sub.slug}>
                                                            <option value={sub.slug}>
                                                                {'\u00A0'.repeat(depth * 4)}{depth > 0 ? '↳ ' : ''}{sub.name}
                                                            </option>
                                                            {renderSubOptions(sub.slug, depth + 1)}
                                                        </Fragment>
                                                    ));
                                            };
                                            return (
                                                <optgroup key={parent.slug} label={parent.name}>
                                                    <option value={parent.slug}>--- General {parent.name} ---</option>
                                                    {renderSubOptions(parent.slug)}
                                                </optgroup>
                                            );
                                        })}
                                    </select>
                                </div>
                            </div>
                            <table className="w-full text-left">
                                <thead className="bg-[#2D1B4E] text-white">
                                    <tr>
                                        <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Product</th>
                                        <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Category</th>
                                        <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Level</th>
                                        <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Price</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredProducts.map(product => (
                                        <tr key={product.id} className="hover:bg-gray-50 transition-all border-b border-gray-100 group">
                                            {quickEditId === product.id ? (
                                                <td colSpan={4} className="p-0 animate-in slide-in-from-top-2 duration-300">
                                                    <div className="bg-blue-50/50 p-6 space-y-4 border-2 border-blue-200 rounded-xl m-2 shadow-sm">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
                                                            <div className="space-y-1">
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-[#2D1B4E]">Title</label>
                                                                <input
                                                                    type="text"
                                                                    value={quickEditForm.name}
                                                                    onChange={e => setQuickEditForm({ ...quickEditForm, name: e.target.value })}
                                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-[#8E2A8B] focus:border-[#8E2A8B] outline-none bg-white"
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-[#2D1B4E]">Amount (₹)</label>
                                                                <input
                                                                    type="number"
                                                                    value={quickEditForm.price}
                                                                    onChange={e => setQuickEditForm({ ...quickEditForm, price: e.target.value })}
                                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-[#8E2A8B] focus:border-[#8E2A8B] outline-none bg-white"
                                                                />
                                                            </div>
                                                            <div className="flex flex-col gap-2 pt-4">
                                                                <div className="flex items-center gap-2">
                                                                    <input
                                                                        type="checkbox"
                                                                        id={`best-${product.id}`}
                                                                        checked={quickEditForm.isBestSeller}
                                                                        onChange={e => setQuickEditForm({ ...quickEditForm, isBestSeller: e.target.checked })}
                                                                        className="w-4 h-4 rounded text-[#8E2A8B] focus:ring-[#8E2A8B] border-gray-300"
                                                                    />
                                                                    <label htmlFor={`best-${product.id}`} className="text-xs font-bold text-gray-700 cursor-pointer">Best Seller</label>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <input
                                                                        type="checkbox"
                                                                        id={`bundle-${product.id}`}
                                                                        checked={quickEditForm.isGiftBundleItem}
                                                                        onChange={e => setQuickEditForm({ ...quickEditForm, isGiftBundleItem: e.target.checked })}
                                                                        className="w-4 h-4 rounded text-[#8E2A8B] focus:ring-[#8E2A8B] border-gray-300"
                                                                    />
                                                                    <label htmlFor={`bundle-${product.id}`} className="text-xs font-bold text-gray-700 cursor-pointer">Gift Bundle</label>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <input
                                                                        type="checkbox"
                                                                        id={`live-${product.id}`}
                                                                        checked={quickEditForm.isLive}
                                                                        onChange={e => setQuickEditForm({ ...quickEditForm, isLive: e.target.checked })}
                                                                        className="w-4 h-4 rounded text-[#8E2A8B] focus:ring-[#8E2A8B] border-gray-300"
                                                                    />
                                                                    <label htmlFor={`live-${product.id}`} className="text-xs font-bold text-[#8E2A8B] cursor-pointer">Live On Site</label>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2 pt-4 justify-end">
                                                                <button
                                                                    onClick={() => setQuickEditId(null)}
                                                                    className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-bold hover:bg-white transition-colors"
                                                                >
                                                                    Cancel
                                                                </button>
                                                                <button
                                                                    onClick={() => handleQuickUpdate(product)}
                                                                    className="px-6 py-2 bg-[#2D1B4E] text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-[#8E2A8B] transition-colors"
                                                                >
                                                                    Update
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            ) : (
                                                <>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                                                                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-gray-800">{product.name}</span>
                                                                    {product.isLive === false && (
                                                                        <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">Draft</span>
                                                                    )}
                                                                </div>
                                                                {/* Hover Actions */}
                                                                <div className="flex items-center gap-3 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <button onClick={() => handleEdit(product)} className="text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-widest">Edit</button>
                                                                    <span className="text-gray-300 text-[10px]">|</span>
                                                                    <button onClick={() => handleQuickEditInit(product)} className="text-[10px] font-bold text-emerald-600 hover:text-emerald-800 uppercase tracking-widest">Quick Edit</button>
                                                                    <span className="text-gray-300 text-[10px]">|</span>
                                                                    <button onClick={() => handleDeleteProduct(product.id, product.name)} className="text-[10px] font-bold text-red-500 hover:text-red-700 uppercase tracking-widest">Remove</button>
                                                                    <span className="text-gray-300 text-[10px]">|</span>
                                                                    <Link to={`/product/${product.slug}`} target="_blank" className="text-[10px] font-bold text-purple-600 hover:text-purple-800 uppercase tracking-widest">View</Link>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">
                                                        <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-bold text-gray-600 uppercase tracking-wide">
                                                            {product.category}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span 
                                                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                                                product.min_affiliate_level === 'Kottravai Pro Partner' 
                                                                ? 'bg-purple-100 text-purple-700 border-purple-200' 
                                                                : product.min_affiliate_level === 'Kottravai Seller'
                                                                ? 'bg-blue-100 text-blue-700 border-blue-200'
                                                                : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                                            }`}
                                                        >
                                                            {product.min_affiliate_level || 'Kottravai Ambassador'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 font-bold text-[#8E2A8B]">₹{product.price}</td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                    {filteredProducts.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                                                No products found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
