import { Quote } from 'lucide-react';
import { useReviews } from '@/context/ReviewContext';

const Testimonials = () => {
    const { getReviewsByPage } = useReviews();
    const testimonials = getReviewsByPage('home');

    return (
        <section className="py-8 md:py-12 bg-white">
            <div className="container px-4">
                <div className="text-center max-w-2xl mx-auto mb-8">
                    <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
                        Loved by Our Community
                    </h2>
                    <p className="text-gray-500">
                        What customers say about our craftsmanship and impact.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {testimonials.map((testimonial) => (
                        <div
                            key={testimonial.id}
                            className="p-8 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center"
                        >
                            <Quote className="w-8 h-8 text-purple-200 mb-6" fill="currentColor" />

                            <p className="text-gray-600 italic mb-8 leading-relaxed">
                                "{testimonial.content}"
                            </p>

                            <div className="mt-auto flex items-center gap-4 text-left">
                                <img
                                    src={testimonial.image}
                                    alt={testimonial.name}
                                    className="w-12 h-12 rounded-full object-cover"
                                />
                                <div>
                                    <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                                    <p className="text-xs font-bold text-purple-700 tracking-wider uppercase">
                                        {testimonial.role}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Testimonials;
