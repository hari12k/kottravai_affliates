import { journalData } from '@/data/homeData';
import { Link } from 'react-router-dom';
import { useNews } from '@/context/NewsContext';

const JournalSection = () => {
    const { newsItems } = useNews();

    return (
        <section className="pt-4 pb-12 bg-white">
            <div className="container px-4">
                {/* Header */}
                <div className="text-center mb-8">
                    <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4">
                        {journalData.mainHeading}
                    </h2>
                    <p className="text-gray-500 max-w-2xl mx-auto">
                        {journalData.subHeading}
                    </p>
                </div>

                {/* Featured Story */}
                <div className="bg-white mb-8 flex flex-col lg:flex-row gap-12 items-center">
                    {/* Featured Image */}
                    <div className="lg:w-3/5 w-full h-[400px] rounded-2xl overflow-hidden shadow-sm">
                        <img
                            src={journalData.featured.image}
                            alt={journalData.featured.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                        />
                    </div>

                    {/* Featured Content */}
                    <div className="lg:w-2/5 w-full text-left">
                        <span className="inline-block bg-primary text-white text-xs font-bold px-3 py-1 uppercase tracking-wider mb-6 rounded-sm">
                            Featured Story
                        </span>
                        <h3 className="text-3xl md:text-4xl font-bold leading-tight text-gray-900 mb-4">
                            {journalData.featured.title}
                        </h3>
                        <p className="text-gray-600 mb-6 leading-relaxed">
                            {journalData.featured.excerpt}
                        </p>
                        <div className="text-sm text-gray-500 font-medium">
                            <span>{journalData.featured.date}</span>
                            <span className="mx-2">•</span>
                            <span>{journalData.featured.category}</span>
                        </div>
                    </div>
                </div>

                {/* Grid of Smaller Posts */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {newsItems.map((post) => (
                        <Link key={post.id} to={post.link} className="group block">
                            <div className="rounded-xl overflow-hidden h-48 mb-4">
                                <img
                                    src={post.image}
                                    alt={post.title}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                            </div>
                            <div>
                                <span className="text-primary text-xs font-bold uppercase tracking-wider mb-2 block">
                                    {post.category}
                                </span>
                                <h4 className="font-bold text-gray-900 mb-2 leading-snug group-hover:text-primary transition-colors">
                                    {post.title}
                                </h4>
                                <p className="text-xs text-gray-400">
                                    {post.date}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default JournalSection;
