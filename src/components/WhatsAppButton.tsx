import { MessageCircle } from 'lucide-react';

const WhatsAppButton = () => {
    const phoneNumber = "916385792718"; // Updated primary number
    const defaultMessage = "Hello, I would like to know more about your products.";

    // Whatapp URL format: https://api.whatsapp.com/send?phone=number&text=encoded_message
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(defaultMessage)}`;

    return (
        <div className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-[150] flex items-center group">
            <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="relative z-10 flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-lg hover:bg-[#20bd5a] hover:scale-110 transition-all duration-300"
                aria-label="Chat on WhatsApp"
            >
                <MessageCircle size={28} />
            </a>
            <span className="absolute right-16 bg-white text-black text-xs md:text-sm px-3 py-1.5 rounded-xl shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none font-bold tracking-wide z-20 origin-right scale-95 group-hover:scale-100">
                Chat with us
            </span>
        </div>
    );
};

export default WhatsAppButton;
