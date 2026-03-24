import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import postsData from '@/data/posts.json';
import MainLayout from '@/layouts/MainLayout';

const BlogList = () => {
    return (
        <MainLayout>
            <Helmet>
                <title>Blog - Kottravai</title>
                <meta name="description" content="Latest news and updates from Kottravai." />
            </Helmet>

            <div className="bg-gray-50 py-16">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl font-bold text-center mb-12">Latest Insights</h1>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {postsData.map((post) => (
                            <div key={post.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                                {post.featured_image && (
                                    <img
                                        src={post.featured_image}
                                        alt={post.title}
                                        className="w-full h-48 object-cover"
                                    />
                                )}
                                <div className="p-6">
                                    <div className="text-sm text-gray-500 mb-2">{post.date}</div>
                                    <h2 className="text-xl font-bold mb-3 line-clamp-2">
                                        <Link to={`/blog/${post.slug}`} className="hover:text-blue-600 transition-colors">
                                            {post.title}
                                        </Link>
                                    </h2>
                                    <p className="text-gray-600 mb-4 line-clamp-3">
                                        {post.excerpt}
                                    </p>
                                    <Link
                                        to={`/blog/${post.slug}`}
                                        className="text-blue-600 font-medium hover:underline"
                                    >
                                        Read More &rarr;
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default BlogList;
