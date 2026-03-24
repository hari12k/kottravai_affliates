import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';

const sanitizeUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('localhost:')) {
        const parts = url.split('/');
        return '/' + parts.slice(3).join('/'); // Turns http://localhost:5000/img.png into /img.png
    }
    return url;
};

const OrderSuccess = () => {
    const location = useLocation();
    // Assuming backend returns orderId, etc., if we don't pass them in state we could just show a generic message
    // If you need access to orderDetails, you should pass them in state during the navigate('/order-success', { state: { orderData } }) call
    const orderDetails = location.state?.orderData || null;

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <MainLayout>
            <Helmet>
                <title>Order Successful - Kottravai</title>
            </Helmet>

            <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 bg-gray-50">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden text-center p-8 md:p-12 max-w-2xl w-full">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto mb-6 animate-bounce">
                        <CheckCircle size={40} />
                    </div>
                    <h1 className="text-3xl font-black text-[#2D1B4E] mb-4">Payment Successful!</h1>
                    <p className="text-gray-600 mb-8">
                        Thank you for your purchase. Your order has been placed successfully and is being processed.
                    </p>

                    {orderDetails && (
                        <div className="bg-purple-50 rounded-xl p-6 text-left mb-8 border border-purple-100">
                            <h3 className="font-bold text-[#2D1B4E] mb-4 border-b border-purple-200 pb-2 text-center">Order Confirmation Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-500">Customer Name</p>
                                    <p className="font-semibold text-gray-800">{orderDetails.customerName}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Email</p>
                                    <p className="font-semibold text-gray-800">{orderDetails.customerEmail}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Transaction ID</p>
                                    <p className="font-semibold text-purple-700 break-all">{orderDetails.paymentId || 'Processing...'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Amount Paid</p>
                                    <p className="font-bold text-[#8E2A8B] text-lg">₹{orderDetails.total}</p>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-purple-200">
                                <p className="text-gray-500 mb-2">Items Purchased:</p>
                                <div className="space-y-2">
                                    {orderDetails.items.map((item: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border border-purple-100">
                                            <div className="flex items-center gap-3">
                                                <img src={sanitizeUrl(item.image)} alt="" className="w-10 h-10 object-cover rounded" loading="lazy" />
                                                <div>
                                                    <span className="text-gray-700 font-medium block">{item.name}</span>
                                                    {item.selectedVariant && (
                                                        <span className="text-[10px] text-[#8E2A8B] font-bold">{item.selectedVariant.weight}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="text-purple-600 font-bold">x{item.quantity}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-purple-200">
                                <p className="text-gray-500">Shipping Address:</p>
                                <p className="font-semibold text-gray-800">{orderDetails.address}, {orderDetails.city}, {orderDetails.district}, {orderDetails.state} - {orderDetails.pincode}</p>
                            </div>
                        </div>
                    )}

                    {!orderDetails && (
                        <div className="bg-purple-50 rounded-xl p-6 text-center mb-8 border border-purple-100">
                            <h3 className="font-bold text-[#2D1B4E] mb-2">Order Confirmed!</h3>
                            <p className="text-sm text-gray-600">You will receive an email confirmation containing your order details shortly.</p>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                        <Link to="/shop" className="bg-[#8E2A8B] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#701a6d] transition-all shadow-lg hover:transform hover:scale-105">
                            Continue Shopping
                        </Link>
                        <Link to="/account" className="bg-white border-2 border-[#8E2A8B] text-[#8E2A8B] px-8 py-3 rounded-xl font-bold hover:bg-purple-50 transition-all hover:transform hover:scale-105">
                            View Orders
                        </Link>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default OrderSuccess;
