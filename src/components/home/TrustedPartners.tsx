import { usePartners } from '@/context/PartnerContext';

const TrustedPartners = () => {
    const { partners } = usePartners();

    return (
        <section className="py-8 md:py-12 bg-[#FAF9F6]">
            <div className="container px-4">
                <h2 className="text-3xl md:text-4xl font-black text-center text-gray-900 mb-6">
                    Trusted By
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-4">
                    {partners.map((partner) => (
                        <div
                            key={partner.id}
                            className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-8 flex items-center justify-center h-32"
                        >
                            {partner.logo ? (
                                <img
                                    src={partner.logo}
                                    alt={partner.name}
                                    className="max-h-16 max-w-full object-contain"
                                />
                            ) : (
                                <span className="text-lg font-bold text-gray-400 text-center">
                                    {partner.name}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default TrustedPartners;
