import React from 'react';
import { MessageCircle, X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (city?: string) => void;
    productName: string;
}

const WhatsAppConfirmModal: React.FC<ModalProps> = ({ isOpen, onClose, onConfirm, productName }) => {
    const [city, setCity] = React.useState('');
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="bg-[#25D366] p-6 text-white text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 scale-110">
                        <MessageCircle size={32} />
                    </div>
                    <h2 className="text-xl font-bold">Chat with Us</h2>
                    <p className="text-white/80 text-sm mt-1">Connect directly with our team</p>
                </div>

                <div className="p-8">
                    <p className="text-gray-600 text-center mb-6">
                        You are about to inquire about <span className="font-bold text-gray-900">"{productName}"</span> via WhatsApp.
                    </p>

                    <div className="mb-6">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Delivery City (Optional)</label>
                        <input
                            type="text"
                            placeholder="e.g. Chennai, Bangalore"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-green-500/20 outline-none transition-all"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                        />
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={() => onConfirm(city)}
                            className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-500/20"
                        >
                            🚀 Send Message
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full bg-gray-50 hover:bg-gray-100 text-gray-500 font-bold py-4 rounded-2xl transition-all"
                        >
                            Cancel
                        </button>
                    </div>

                    <p className="text-[10px] text-gray-400 text-center mt-6 uppercase tracking-widest font-bold">
                        Direct Team Contact
                    </p>
                </div>

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>
            </div>
        </div>
    );
};

export default WhatsAppConfirmModal;
