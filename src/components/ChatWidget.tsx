import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '@/context/ProductContext';
import { useCart } from '@/context/CartContext';
import analytics from '@/utils/analyticsService';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    type?: 'text' | 'product-list' | 'options';
    products?: any[];
    options?: { label: string; value: string }[];
}

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const { products, categories } = useProducts();
    const { addToCart } = useCart();
    const navigate = useNavigate();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => {
        if (isOpen) {
            analytics.trackEvent('chat_opened');
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            // Initial greeting
            setMessages([
                {
                    id: '1',
                    text: "Hello! Welcome to Kottravai. I'm Thozhi AI, your personal shopping assistant. How can I help you today?",
                    sender: 'bot',
                    type: 'options',
                    options: [
                        { label: 'Shop Collections', value: 'shop_collections' },
                        { label: 'Track Order', value: 'track_order' },
                        { label: 'Best Sellers', value: 'best_sellers' },
                        { label: 'FAQs', value: 'faqs' }
                    ]
                }
            ]);
        }
    }, [isOpen]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSend = () => {
        if (!input.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            text: input,
            sender: 'user'
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        processBotResponse(input);
        analytics.trackEvent('chat_message_sent', { text: input });
    };

    const handleOptionClick = (value: string) => {
        // Handle Direct Actions
        if (value === 'whatsapp_chat') {
            window.open('https://api.whatsapp.com/send?phone=916385792718&text=Hello,%20I%20need%20assistance', '_blank');
            return;
        }
        if (value === 'read_shipping') {
            navigate('/shipping-policy');
            setIsOpen(false);
            return;
        }
        if (value === 'read_refund') {
            navigate('/refund-policy');
            setIsOpen(false);
            return;
        }
        if (value === 'go_orders') {
            navigate('/account');
            setIsOpen(false);
            return;
        }
        if (value === 'view_shop') {
            navigate('/shop');
            setIsOpen(false);
            return;
        }
        if (value.startsWith('view_cat_')) {
            const slug = value.replace('view_cat_', '');
            navigate(`/category/${slug}`);
            setIsOpen(false);
            return;
        }

        let text = '';
        if (value.startsWith('cat_')) {
            const catSlug = value.replace('cat_', '');
            const category = categories.find(c => c.slug === catSlug);
            text = category ? `Show me ${category.name}` : 'Show me products';
        } else if (value.startsWith('select_product_')) {
            const productId = value.replace('select_product_', '');
            const product = products.find(p => p.id === productId);
            text = product ? `I'm interested in ${product.name}` : 'I like this product';
        } else if (value.startsWith('faq_')) {
            const question = value.replace('faq_', '').replace(/_/g, ' ');
            text = question.charAt(0).toUpperCase() + question.slice(1) + '?';
        } else if (value.startsWith('view_detail_')) {
            const productId = value.replace('view_detail_', '');
            const product = products.find(p => p.id === productId);
            if (product) {
                navigate(`/product/${product.slug}`);
                setIsOpen(false);
                return;
            }
        } else if (value.startsWith('add_cart_')) {
            const productId = value.replace('add_cart_', '');
            const product = products.find(p => p.id === productId);
            if (product) {
                // Add to cart directly
                addToCart(product);
                text = `Add ${product.name} to cart`;
            }
        } else if (value.startsWith('checkout_')) {
            const productId = value.replace('checkout_', '');
            const product = products.find(p => p.id === productId);
            if (product) {
                addToCart(product);
                navigate('/checkout');
                setIsOpen(false);
                return;
            }
        } else {
            switch (value) {
                case 'shop_collections': text = 'I want to shop'; break;
                case 'best_sellers': text = 'Show me best sellers'; break;
                case 'faqs': text = 'I have a question'; break;
                case 'track_order': text = 'Track my order'; break;
                case 'search_products': text = 'I want to find products'; break;
                case 'help_support': text = 'Help & Support'; break;
                case 'confirm_track_order':
                    navigate('/account');
                    setIsOpen(false);
                    return;
                case 'checkout_cart':
                    navigate('/cart');
                    setIsOpen(false);
                    return;
                default: text = value;
            }
        }

        const userMsg: Message = {
            id: Date.now().toString(),
            text: text,
            sender: 'user'
        };

        setMessages(prev => [...prev, userMsg]);
        processBotResponse(text, value);
        analytics.trackEvent('chat_option_selected', { option: value, text });
    };

    const processBotResponse = async (text: string, intentOverride?: string) => {
        setIsTyping(true);

        // Simulate thinking delay
        setTimeout(() => {
            const lowerText = text.toLowerCase();
            let botResponse: Message = {
                id: (Date.now() + 1).toString(),
                text: "I'm not sure I understand. Could you please clarify?",
                sender: 'bot'
            };

            // Intent Classification Logic
            if (intentOverride === 'shop_collections') {
                // Filter parent categories
                const parentCats = categories.filter(c => !c.parent).slice(0, 8);
                botResponse = {
                    id: (Date.now() + 1).toString(),
                    text: "Here are our product collections:",
                    sender: 'bot',
                    type: 'options',
                    options: parentCats.map(c => ({ label: c.name, value: `cat_${c.slug}` }))
                };
            } else if (intentOverride && intentOverride.startsWith('cat_')) {
                const catSlug = intentOverride.replace('cat_', '');
                const category = categories.find(c => c.slug === catSlug);

                // Find products in this category (or subcategories)
                const categoryMatches = products.filter(p => {
                    if (p.categorySlug === catSlug) return true;
                    // Check if product's category parent is this category
                    const prodCat = categories.find(c => c.slug === p.categorySlug);
                    return prodCat && prodCat.parent === catSlug;
                }).slice(0, 3);

                if (categoryMatches.length > 0) {
                    botResponse = {
                        id: (Date.now() + 1).toString(),
                        text: `Here are some popular items in ${category?.name || 'this collection'}:`,
                        sender: 'bot',
                        type: 'product-list',
                        products: categoryMatches
                    };
                    // Add "View All" option in next message or append to options
                    // Since structure limits one type, we can send a follow up or just rely on product click
                    // Let's just show products. 
                } else {
                    botResponse = {
                        id: (Date.now() + 1).toString(),
                        text: `I couldn't find any products in ${category?.name} right now.`,
                        sender: 'bot',
                        type: 'options',
                        options: [{ label: 'View All Categories', value: 'shop_collections' }]
                    };
                }
            } else if (intentOverride === 'best_sellers') {
                // Filter products that are marked as bestSeller or just take top ones
                const bestSellers = products.filter(p => p.isBestSeller).slice(0, 3);
                // Fallback if no best sellers marked
                const displayProducts = bestSellers.length > 0 ? bestSellers : products.slice(0, 3);

                botResponse = {
                    id: (Date.now() + 1).toString(),
                    text: "Check out our customer favorites:",
                    sender: 'bot',
                    type: 'product-list',
                    products: displayProducts
                };
            } else if (intentOverride === 'faqs') {
                botResponse = {
                    id: (Date.now() + 1).toString(),
                    text: "What would you like to know?",
                    sender: 'bot',
                    type: 'options',
                    options: [
                        { label: 'How long is shipping?', value: 'faq_shipping_time' },
                        { label: 'Do you accept returns?', value: 'faq_return_policy' },
                        { label: 'How to contact support?', value: 'faq_contact_support' }
                    ]
                };
            } else if (intentOverride && intentOverride.startsWith('faq_')) {
                const faqType = intentOverride.replace('faq_', '');
                let answer = '';
                let followUpOptions: { label: string; value: string }[] = [];

                if (faqType === 'shipping_time') {
                    answer = "Standard domestic shipping takes 3-5 business days. International shipping takes 7-14 days.";
                    followUpOptions = [{ label: 'Read Shipping Policy', value: 'read_shipping' }];
                } else if (faqType === 'return_policy') {
                    answer = "We offer a 7-day return policy for damaged or defective items.";
                    followUpOptions = [{ label: 'Read Refund Policy', value: 'read_refund' }];
                } else if (faqType === 'contact_support') {
                    answer = "You can reach us via WhatsApp or email at support@kottravai.in.";
                    followUpOptions = [{ label: 'Chat with us', value: 'whatsapp_chat' }];
                }

                botResponse = {
                    id: (Date.now() + 1).toString(),
                    text: answer,
                    sender: 'bot',
                    type: 'options',
                    options: followUpOptions
                };
            } else if (intentOverride && intentOverride.startsWith('select_product_')) {
                const productId = intentOverride.replace('select_product_', '');
                const product = products.find(p => p.id === productId);
                if (product) {
                    botResponse = {
                        id: (Date.now() + 1).toString(),
                        text: `What would you like to do with ${product.name}?`,
                        sender: 'bot',
                        type: 'options',
                        options: [
                            { label: 'View Details', value: `view_detail_${product.id}` },
                            { label: 'Add to Cart', value: `add_cart_${product.id}` },
                            { label: 'Checkout Now', value: `checkout_${product.id}` }
                        ]
                    };
                }
            } else if (intentOverride && intentOverride.startsWith('add_cart_')) {
                const productId = intentOverride.replace('add_cart_', '');
                const product = products.find(p => p.id === productId);
                const productName = product ? product.name : 'Product';

                botResponse = {
                    id: (Date.now() + 1).toString(),
                    text: `✓ ${productName} added to cart successfully! What would you like to do next?`,
                    sender: 'bot',
                    type: 'options',
                    options: [
                        { label: 'View Cart', value: 'checkout_cart' },
                        { label: 'Continue Shopping', value: 'shop_collections' }
                    ]
                };
            } else if (intentOverride === 'checkout_cart') { // Adding this handling here for the above option
                // Navigate is done in handleOptionClick usually, but if we need text response first?
                // Let's assume handleOptionClick handles it if we add it there.
                // Actually, let's perform navigation in handleOptionClick for cleaner UX. 
                // So we won't get here.
            } else if (intentOverride === 'search_products' || lowerText.includes('find') || lowerText.includes('search') || lowerText.includes('looking for') || lowerText.includes('buy')) {
                // Ask for keywords if not present
                if (intentOverride === 'search_products') {
                    botResponse = {
                        id: (Date.now() + 1).toString(),
                        text: "Great! What are you looking for today? (e.g., 'terracotta jewellery', 'gift hamper')",
                        sender: 'bot'
                    };
                } else {
                    // Perform search
                    const searchTerms = lowerText.replace(/find|search|looking for|buy/g, '').trim();
                    if (searchTerms.length < 2) {
                        botResponse = {
                            id: (Date.now() + 1).toString(),
                            text: "Could you be more specific about what you're looking for?",
                            sender: 'bot'
                        };
                    } else {
                        // Check if search term matches a category name directly
                        const matchedCat = categories.find(c => c.name.toLowerCase().includes(searchTerms.toLowerCase()));

                        if (matchedCat) {
                            botResponse = {
                                id: (Date.now() + 1).toString(),
                                text: `Did you mean ${matchedCat.name}?`,
                                sender: 'bot',
                                type: 'options',
                                options: [
                                    { label: `View ${matchedCat.name}`, value: `cat_${matchedCat.slug}` },
                                    { label: 'No, search products', value: 'search_fallback_' + searchTerms }
                                ]
                            };
                        } else {
                            const matches = products.filter(p =>
                                p.name.toLowerCase().includes(searchTerms) ||
                                p.category.toLowerCase().includes(searchTerms) ||
                                p.description?.toLowerCase().includes(searchTerms)
                            ).slice(0, 3);

                            if (matches.length > 0) {
                                botResponse = {
                                    id: (Date.now() + 1).toString(),
                                    text: `I found these products matching "${searchTerms}":`,
                                    sender: 'bot',
                                    type: 'product-list',
                                    products: matches
                                };
                            } else {
                                botResponse = {
                                    id: (Date.now() + 1).toString(),
                                    text: `I couldn't find matches for "${searchTerms}".`,
                                    sender: 'bot',
                                    type: 'options',
                                    options: [
                                        { label: 'Browse Collections', value: 'shop_collections' },
                                        { label: 'Chat with us', value: 'whatsapp_chat' }
                                    ]
                                };
                            }
                        }
                    }
                }
            } else if (intentOverride && intentOverride.startsWith('search_fallback_')) {
                const searchTerms = intentOverride.replace('search_fallback_', '');
                const matches = products.filter(p =>
                    p.name.toLowerCase().includes(searchTerms) ||
                    p.category.toLowerCase().includes(searchTerms) ||
                    p.description?.toLowerCase().includes(searchTerms)
                ).slice(0, 3);

                if (matches.length > 0) {
                    botResponse = {
                        id: (Date.now() + 1).toString(),
                        text: `Here are products matching "${searchTerms}":`,
                        sender: 'bot',
                        type: 'product-list',
                        products: matches
                    };
                } else {
                    botResponse = {
                        id: (Date.now() + 1).toString(),
                        text: `I couldn't find matches for "${searchTerms}".`,
                        sender: 'bot',
                        type: 'options',
                        options: [
                            { label: 'Browse Collections', value: 'shop_collections' }
                        ]
                    };
                }
            } else if (intentOverride === 'view_shop' || lowerText.includes('shop')) {
                botResponse = {
                    id: (Date.now() + 1).toString(),
                    text: "You can browse our full collection on the shop page.",
                    sender: 'bot',
                    type: 'text'
                };
            } else if (intentOverride === 'track_order' || lowerText.includes('track') || lowerText.includes('order')) {
                botResponse = {
                    id: (Date.now() + 1).toString(),
                    text: "I can take you to your order history page to track your shipments.",
                    sender: 'bot',
                    type: 'options',
                    options: [
                        { label: 'Go to Orders', value: 'confirm_track_order' }
                    ]
                };
            } else if (intentOverride === 'help_support' || lowerText.includes('help') || lowerText.includes('support') || lowerText.includes('contact')) {
                botResponse = {
                    id: (Date.now() + 1).toString(),
                    text: "How can we assist you?",
                    sender: 'bot',
                    type: 'options',
                    options: [
                        { label: 'Shipping Info', value: 'read_shipping' },
                        { label: 'Returns & Refunds', value: 'read_refund' },
                        { label: 'Chat with our Team', value: 'whatsapp_chat' }
                    ]
                };
            } else if (intentOverride === 'shipping_policy' || lowerText.includes('shipping')) {
                botResponse = {
                    id: (Date.now() + 1).toString(),
                    text: "We ship worldwide! Standard domestic delivery takes 3-5 business days.",
                    sender: 'bot',
                    type: 'options',
                    options: [{ label: 'Read Full Policy', value: 'read_shipping' }]
                };
            } else if (intentOverride === 'refund_policy' || lowerText.includes('return') || lowerText.includes('refund')) {
                botResponse = {
                    id: (Date.now() + 1).toString(),
                    text: "We accept returns within 7 days of delivery for damaged items.",
                    sender: 'bot',
                    type: 'options',
                    options: [{ label: 'Read Refund Policy', value: 'read_refund' }]
                };
            } else {
                // Fallback for greetings or unknown
                if (lowerText.includes('hi') || lowerText.includes('hello')) {
                    botResponse = {
                        id: (Date.now() + 1).toString(),
                        text: "Hello there! How can I help you today?",
                        sender: 'bot',
                        type: 'options',
                        options: [
                            { label: 'Shop Collections', value: 'shop_collections' },
                            { label: 'Help', value: 'help_support' }
                        ]
                    };
                } else {
                    botResponse = {
                        id: (Date.now() + 1).toString(),
                        text: "I'm not sure I understand. Would you like to shop or get support?",
                        sender: 'bot',
                        type: 'options',
                        options: [
                            { label: 'Shop Collections', value: 'shop_collections' },
                            { label: 'Help', value: 'help_support' }
                        ]
                    };
                }
            }

            setIsTyping(false);
            setMessages(prev => [...prev, botResponse]);
        }, 1000);
    };

    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-[80px] md:bottom-6 right-6 md:right-8 z-[90] p-3.5 md:p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 group flex items-center justify-center
          ${isOpen ? 'bg-[#2D1B4E] rotate-90' : 'bg-[#b5128f] hover:bg-[#8E2A8B]'}`}
            >
                {isOpen ? <X className="text-white" size={24} /> : <Bot className="text-white" size={24} />}
            </button>

            {/* Chat Window */}
            <div className={`fixed bottom-[150px] md:bottom-[92px] right-6 md:right-8 z-[90] w-[90vw] md:w-[350px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col transition-all duration-500 origin-bottom-right
        ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-75 opacity-0 translate-y-20 pointer-events-none'}`}
                style={{ maxHeight: '60vh' }}
            >
                {/* Header */}
                <div className="bg-[#2D1B4E] p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white">
                        <ShoppingBag size={20} />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-sm">Thozhi AI</h3>
                        <p className="text-white/60 text-[10px] flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                            Online
                        </p>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 min-h-[300px]">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed shadow-sm
                ${msg.sender === 'user'
                                    ? 'bg-[#b5128f] text-white rounded-tr-sm'
                                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'
                                }`}
                            >
                                {msg.text}

                                {/* Product Recommendations */}
                                {msg.type === 'product-list' && msg.products && (
                                    <div className="mt-3 space-y-2">
                                        {msg.products.map(product => (
                                            <div
                                                key={product.id}
                                                className="block bg-gray-50 rounded-lg p-2 hover:bg-gray-100 transition-colors border border-gray-100 group cursor-pointer"
                                                onClick={() => handleOptionClick(`select_product_${product.id}`)}
                                            >
                                                <div className="flex gap-2">
                                                    <img src={product.image} alt={product.name} className="w-12 h-12 object-cover rounded-md" loading="lazy" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold text-[#2D1B4E] truncate group-hover:text-[#b5128f]">{product.name}</p>
                                                        <p className="text-[10px] text-gray-500">
                                                            {product.isCustomRequest
                                                                ? 'Custom Quote'
                                                                : product.price > 0
                                                                    ? `₹${Number(product.price).toLocaleString('en-IN')}`
                                                                    : product.variants && product.variants.length > 0
                                                                        ? `From ₹${Number(product.variants[0].price).toLocaleString('en-IN')}`
                                                                        : '₹0'
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Quick Options */}
                                {msg.type === 'options' && msg.options && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {msg.options.map((opt) => (
                                            <button
                                                key={opt.value}
                                                onClick={() => handleOptionClick(opt.value)}
                                                className="text-[10px] bg-gray-100 hover:bg-[#b5128f] hover:text-white text-gray-700 font-bold py-1.5 px-3 rounded-full transition-colors border border-gray-200"
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-tl-sm p-3 shadow-sm">
                                <div className="flex gap-1">
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-3 bg-white border-t border-gray-100">
                    <div className="flex items-center gap-2 bg-gray-50 rounded-full px-4 py-2 border border-gray-200 focus-within:border-[#b5128f] focus-within:ring-1 focus-within:ring-[#b5128f]/20 transition-all">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Type your message..."
                            className="flex-1 bg-transparent border-none focus:ring-0 text-sm placeholder:text-gray-400"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim()}
                            className="p-1.5 rounded-full bg-[#b5128f] text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#8E2A8B] transition-colors"
                        >
                            <Send size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ChatWidget;
