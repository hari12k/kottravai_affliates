import React from 'react';

interface Product {
    id: string;
    name: string;
    price: number;
    image: string;
}

const ProductCard: React.FC<{ product: Product }> = ({ product }) => {


    return (
        <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
            <div className="relative h-64 overflow-hidden">
                <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    AVAILABLE
                </div>
            </div>

            <div className="p-5">
                <h3 className="text-lg font-bold text-gray-900 mb-1">{product.name}</h3>
                <p className="text-[#8E2A8B] font-black text-xl mb-6 flex items-center gap-1">
                    <span className="text-sm font-normal text-gray-400">₹</span>
                    {product.price.toLocaleString('en-IN')}
                </p>

            </div>

        </div>
    );
};

export default ProductCard;
