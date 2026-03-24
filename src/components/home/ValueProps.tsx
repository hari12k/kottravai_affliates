import { valueProps } from '@/data/homeData';
import { Headphones, Package, Truck, RefreshCcw, HelpCircle } from 'lucide-react';

const iconMap = {
    Headphones,
    Package,
    Truck,
    RefreshCcw
};

const ValueProps = () => {
    return (
        <section className="py-8 md:py-12 bg-white border-t border-gray-100">
            <div className="container px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {valueProps.map((prop) => {
                        const Icon = (iconMap[prop.icon as keyof typeof iconMap] || HelpCircle) as React.ElementType;

                        return (
                            <div key={prop.id} className="flex items-center p-6 border border-gray-100 rounded-lg">
                                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mr-5 flex-shrink-0">
                                    <Icon size={24} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 mb-1">{prop.title}</h4>
                                    <p className="text-sm text-gray-500">{prop.desc}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default ValueProps;
