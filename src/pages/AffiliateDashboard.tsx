import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import MainLayout from '@/layouts/MainLayout';
import { 
    TrendingUp, 
    DollarSign, 
    Users, 
    ShoppingBag, 
    ArrowUpRight, 
    Copy, 
    CheckCircle,
    Clock,
    Activity,
    ChevronRight,
    Search,
    AlertCircle,
    ExternalLink
} from 'lucide-react';
import { 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer, 
    AreaChart, 
    Area
} from 'recharts';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface DashboardStats {
    profile: {
        name: string;
        referral_code: string;
        level: string;
        status: string;
    };
    stats: {
        total_revenue: number;
        total_commission: number;
        available_balance: number;
        pending_commission: number;
        approved_commission: number;
        paid_commission: number;
        total_clicks: number;
        total_conversions: number;
        conversion_rate: string;
    };
    performance: {
        date: string;
        clicks: number;
        sales: number;
        commission: number;
    }[];
    recent_sales: {
        id: string;
        order_number: string;
        product_name: string;
        sale_amount: number;
        commission_amount: number;
        status: string;
        created_at: string;
    }[];
}

const AffiliateDashboard = () => {
    const { isAuthenticated } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await axios.get(`${API_URL}/affiliates/me/dashboard-stats`, {
                    headers: {
                        'Authorization': `Bearer ${sessionStorage.getItem('kottravai_token')}`
                    }
                });
                if (response.data.success) {
                    setStats(response.data);
                } else {
                    toast.error(response.data.message || 'Failed to load dashboard');
                }
            } catch (error: any) {
                console.error('Failed to fetch affiliate stats:', error);
                if (error.response?.status === 404) {
                    // Not an affiliate or profile not found
                } else {
                    toast.error('Unable to load affiliate performance data');
                }
            } finally {
                setLoading(false);
            }
        };

        if (isAuthenticated) {
            fetchStats();
        }
    }, [isAuthenticated]);

    const handleCopyLink = () => {
        if (!stats?.profile.referral_code) return;
        const link = `${window.location.origin}/?ref=${stats.profile.referral_code}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        toast.success('Referral link copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-4">
                    <div className="relative w-20 h-20 mb-8">
                        <div className="absolute inset-0 border-[3px] border-[#8E2A8B]/10 rounded-full"></div>
                        <div className="absolute inset-0 border-[3px] border-[#2D1B4E] rounded-full border-t-transparent animate-spin"></div>
                    </div>
                    <p className="text-[#2D1B4E] font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Syncing Performance Data</p>
                </div>
            </MainLayout>
        );
    }

    if (!stats) {
        return (
            <MainLayout>
                <div className="min-h-screen bg-[#FAF9F6] py-32">
                    <div className="container mx-auto px-4 max-w-lg text-center">
                        <AlertCircle size={64} className="mx-auto text-amber-500 mb-6" />
                        <h1 className="text-3xl font-black text-[#2D1B4E] mb-4">Affiliate Profile Not Found</h1>
                        <p className="text-gray-500 mb-10 leading-relaxed">
                            It looks like your account isn't registered for our affiliate program yet. 
                            Join the Kottravai Alliance to start earning commissions!
                        </p>
                        <button 
                            onClick={() => window.location.href = '/alliance'}
                            className="bg-[#2D1B4E] text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-[#8E2A8B] transition-all shadow-xl shadow-purple-200"
                        >
                            Become a Partner
                        </button>
                    </div>
                </div>
            </MainLayout>
        );
    }

    const referralLink = `${window.location.origin}/?ref=${stats.profile.referral_code}`;

    return (
        <MainLayout>
            <Helmet>
                <title>Affiliate Dashboard - Kottravai</title>
            </Helmet>

            <div className="bg-[#FAF9F6] min-h-screen pt-8 pb-20 md:pt-12 md:pb-32 font-sans overflow-x-hidden">
                <div className="container mx-auto px-4 max-w-7xl">
                    
                    {/* Hero Header Section */}
                    <div className="bg-gradient-to-br from-[#2D1B4E] to-[#1A1A1A] rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden mb-10 group">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8E2A8B]/10 rounded-full -mr-20 -mt-20 blur-3xl transition-all duration-1000 group-hover:bg-[#8E2A8B]/20"></div>
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                            <div>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 text-[10px] font-black uppercase tracking-widest text-white/80">
                                        Partner Level: {stats.profile.level}
                                    </div>
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                </div>
                                <h1 className="text-4xl md:text-5xl font-black mb-4 leading-none tracking-tight">Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8E2A8B] to-purple-400">{stats.profile.name}</span>!</h1>
                                <p className="text-white/60 max-w-xl font-medium text-lg leading-relaxed">Your performance tracking is live. Monitor your referral ecosystem and track your earnings in real-time.</p>
                            </div>

                            <div className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10 w-full md:w-auto min-w-[320px]">
                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-3">Your Referral Asset</p>
                                <div className="flex items-center gap-2 mb-4 bg-black/30 p-2 rounded-2xl border border-white/5">
                                    <code className="text-sm font-black text-purple-300 px-3 tracking-wider truncate max-w-[200px]">{referralLink}</code>
                                    <button 
                                        onClick={handleCopyLink}
                                        className="ml-auto bg-[#8E2A8B] hover:bg-white hover:text-[#8E2A8B] p-3 rounded-xl transition-all shadow-lg active:scale-95"
                                    >
                                        {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
                                    </button>
                                </div>
                                <div className="flex items-center gap-3 text-xs font-bold text-white/60">
                                    <ExternalLink size={14} className="text-[#8E2A8B]" />
                                    <span>Share this link to earn 10% commission</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                        {/* Total Revenue */}
                        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl hover:shadow-2xl transition-all duration-500 group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-purple-50 rounded-2xl group-hover:bg-[#8E2A8B] transition-colors duration-500">
                                    <TrendingUp size={24} className="text-[#8E2A8B] group-hover:text-white transition-colors duration-500" />
                                </div>
                                <div className="flex items-center gap-1 text-emerald-500 font-black text-xs">
                                    <ArrowUpRight size={14} />
                                    <span>Live</span>
                                </div>
                            </div>
                            <div className="text-3xl font-black text-[#2D1B4E] mb-1">₹{stats.stats.total_revenue.toLocaleString()}</div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Sales Generated</p>
                        </div>

                        {/* Total Earnings */}
                        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl hover:shadow-2xl transition-all duration-500 group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-emerald-50 rounded-2xl group-hover:bg-emerald-500 transition-colors duration-500">
                                    <DollarSign size={24} className="text-emerald-500 group-hover:text-white transition-colors duration-500" />
                                </div>
                                <div className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                    Verified
                                </div>
                            </div>
                            <div className="text-3xl font-black text-[#2D1B4E] mb-1">₹{stats.stats.total_commission.toLocaleString()}</div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Commission Earned</p>
                        </div>

                        {/* Available Balance */}
                        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl hover:shadow-2xl transition-all duration-500 group bg-gradient-to-br from-white to-purple-50/30">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-50 rounded-2xl group-hover:bg-blue-500 transition-colors duration-500">
                                    <Activity size={24} className="text-blue-500 group-hover:text-white transition-colors duration-500" />
                                </div>
                                <button className="text-[10px] font-black text-white bg-[#2D1B4E] px-3 py-1.5 rounded-xl hover:bg-[#8E2A8B] transition-all">
                                    Withdraw
                                </button>
                            </div>
                            <div className="text-3xl font-black text-[#2D1B4E] mb-1">₹{stats.stats.available_balance.toLocaleString()}</div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Available for Payout</p>
                        </div>

                        {/* Conversion Rate */}
                        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl hover:shadow-2xl transition-all duration-500 group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-amber-50 rounded-2xl group-hover:bg-amber-500 transition-colors duration-500">
                                    <Users size={24} className="text-amber-500 group-hover:text-white transition-colors duration-500" />
                                </div>
                                <div className="text-[10px] font-black text-amber-600 uppercase tracking-widest">
                                    {stats.stats.total_conversions} Sales
                                </div>
                            </div>
                            <div className="text-3xl font-black text-[#2D1B4E] mb-1">{stats.stats.conversion_rate}%</div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Visit to Sale CRM</p>
                        </div>
                    </div>

                    {/* Chart and Performance Trends */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h4 className="text-xl font-black text-[#2D1B4E]">Performance Trend</h4>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">7-Day Sales & Engagement Delta</p>
                                </div>
                                <div className="flex gap-2">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#8E2A8B]">
                                        <div className="w-2 h-2 rounded-full bg-[#8E2A8B]"></div>
                                        Earnings
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-400 ml-4">
                                        <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                                        Visits
                                    </div>
                                </div>
                            </div>
                            
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={stats.performance}>
                                        <defs>
                                            <linearGradient id="colorComm" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8E2A8B" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#8E2A8B" stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                        <XAxis 
                                            dataKey="date" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{fill: '#9CA3AF', fontWeight: '900', fontSize: 10}} 
                                            dy={10}
                                            tickFormatter={(val) => {
                                                const d = new Date(val);
                                                return d.toLocaleDateString('en-US', { weekday: 'short' });
                                            }}
                                        />
                                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontWeight: '900', fontSize: 10}} />
                                        <Tooltip 
                                            contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: '900', fontSize: '12px', padding: '15px'}}
                                        />
                                        <Area type="monotone" dataKey="clicks" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorClicks)" />
                                        <Area type="monotone" dataKey="commission" stroke="#8E2A8B" strokeWidth={4} fillOpacity={1} fill="url(#colorComm)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl flex flex-col">
                            <h4 className="text-xl font-black text-[#2D1B4E] mb-6">Commission Ledger</h4>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-8">Detailed breakdown of your asset lifecycle</p>

                            <div className="space-y-6 flex-1">
                                <div className="p-5 rounded-3xl bg-amber-50/50 border border-amber-100 flex items-center justify-between group hover:bg-amber-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-amber-500">
                                            <Clock size={24} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] mb-1">In Pipeline</p>
                                            <p className="text-lg font-black text-[#2D1B4E]">₹{stats.stats.pending_commission.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={20} className="text-amber-200 group-hover:translate-x-1 transition-transform" />
                                </div>

                                <div className="p-5 rounded-3xl bg-emerald-50/50 border border-emerald-100 flex items-center justify-between group hover:bg-emerald-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-emerald-500">
                                            <CheckCircle size={24} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-1">Approved Assets</p>
                                            <p className="text-lg font-black text-[#2D1B4E]">₹{stats.stats.approved_commission.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={20} className="text-emerald-200 group-hover:translate-x-1 transition-transform" />
                                </div>

                                <div className="p-5 rounded-3xl bg-blue-50/50 border border-blue-100 flex items-center justify-between group hover:bg-blue-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-blue-500">
                                            <ShoppingBag size={24} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1">Paid Out</p>
                                            <p className="text-lg font-black text-[#2D1B4E]">₹{stats.stats.paid_commission.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={20} className="text-blue-200 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>

                            <div className="mt-8 p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center">
                                <p className="text-[10px] font-bold text-gray-400 leading-relaxed uppercase tracking-widest">
                                    Minimum payout threshold is ₹500. Withdrawals are processed every Monday.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Recent Conversions Table */}
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
                        <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h4 className="text-2xl font-black text-[#2D1B4E]">Recent Conversions</h4>
                                <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Real-time attribution feed of your referral sales</p>
                            </div>
                            <div className="relative w-full md:w-auto">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                    <Search size={16} />
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="Filter by Order ID..."
                                    className="bg-gray-50 border border-transparent pl-12 pr-6 py-3 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#8E2A8B]/20 transition-all outline-none w-full md:w-64"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50/50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Ref / Date</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Product Detail</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Sale Volume</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-center">Earnings</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {stats.recent_sales.map((sale) => (
                                        <tr key={sale.id} className="hover:bg-gray-50/30 transition-all group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-1.5 h-6 bg-[#8E2A8B] rounded-full group-hover:h-8 transition-all"></div>
                                                    <div>
                                                        <div className="font-black text-[#2D1B4E] text-sm tracking-tight">#{sale.order_number}</div>
                                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date(sale.created_at).toLocaleDateString('en-IN', {day: '2-digit', month: 'short'})}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="font-black text-[#2D1B4E] text-xs uppercase tracking-wider truncate max-w-[200px]">{sale.product_name || 'Multi-Product Order'}</div>
                                                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Organic Acquisition</div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="font-black text-[#2D1B4E] text-sm">₹{sale.sale_amount.toLocaleString()}</div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className="inline-block px-4 py-1.5 bg-emerald-50 rounded-xl">
                                                    <div className="text-sm font-black text-emerald-600">₹{sale.commission_amount.toLocaleString()}</div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm ${
                                                    sale.status === 'Completed' ? 'bg-emerald-500 text-white shadow-emerald-200/50' : 
                                                    sale.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 
                                                    'bg-rose-50 text-rose-500'
                                                }`}>
                                                    {sale.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {stats.recent_sales.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-32 text-center">
                                                <div className="flex flex-col items-center justify-center gap-8 max-w-sm mx-auto">
                                                    <div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center text-gray-200 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                                                        <TrendingUp size={48} />
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-sm leading-relaxed">Pioneering the First Conversion</p>
                                                        <p className="text-gray-300 text-xs font-bold mt-2">Start sharing your referral link to see real-time attribution data here.</p>
                                                    </div>
                                                    <button 
                                                        onClick={handleCopyLink}
                                                        className="px-8 py-3 bg-[#2D1B4E] text-white rounded-2xl font-black text-[10px] tracking-widest uppercase hover:bg-[#8E2A8B] transition-all shadow-xl shadow-purple-200"
                                                    >
                                                        Copy Referral Link
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default AffiliateDashboard;
