import { useVideos } from '@/context/VideoContext';
import { ArrowRight } from 'lucide-react';

const VideoGallery = () => {
    const { videos } = useVideos();

    return (
        <section className="py-8 md:py-12 bg-white">
            <div className="container px-4">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-6">

                    <h2 className="text-3xl md:text-4xl font-black text-[#2D1B4E] mb-4">
                        Watch Kottravai in Action
                    </h2>
                    <p className="text-lg text-gray-600">
                        Stories, craftsmanship, and wellness—straight from the artisans who make it happen.
                    </p>
                </div>

                {/* Video Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {videos.map((video) => (
                        <article
                            key={video.id}
                            className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-[0_20px_40px_rgba(142,42,139,0.15)] transition-all duration-300 border border-gray-100 flex flex-col group -translate-y-0 hover:-translate-y-2"
                        >
                            <div className="relative w-full aspect-video bg-gray-100">
                                <iframe
                                    className="absolute top-0 left-0 w-full h-full border-0"
                                    src={video.url}
                                    title={video.title}
                                    loading="lazy"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                ></iframe>
                            </div>
                            <div className="p-6 flex-grow flex flex-col">
                                <h3 className="text-lg font-bold text-[#2D1B4E] mb-2 leading-snug line-clamp-2 group-hover:text-[#8E2A8B] transition-colors">
                                    {video.title}
                                </h3>
                            </div>
                        </article>
                    ))}
                </div>

                {/* Footer Link */}
                <div className="text-center mt-6">
                    <a
                        href="https://www.youtube.com/@Kottravai_in"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-8 py-3 bg-transparent text-[#8E2A8B] border border-[#8E2A8B] rounded-full font-semibold hover:bg-[#8E2A8B] hover:text-white transition-all duration-300 shadow-sm hover:shadow-lg group"
                    >
                        Visit Our Channel
                        <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </a>
                </div>
            </div>
        </section>
    );
};

export default VideoGallery;
