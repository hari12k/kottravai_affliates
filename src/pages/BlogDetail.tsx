import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import postsData from '@/data/posts.json';
import MainLayout from '@/layouts/MainLayout';
import NotFound from '@/pages/NotFound';
import { ArrowLeft } from 'lucide-react';

const BlogDetail = () => {
    const { slug } = useParams();
    const post = postsData.find(p => p.slug === slug);

    if (!post) {
        return <NotFound />;
    }

    return (
        <MainLayout>
            <Helmet>
                <title>{post.title} - Kottravai Blog</title>
                <meta name="description" content={post.excerpt} />
            </Helmet>

            <article className="py-16">
                <div className="container mx-auto px-4 max-w-4xl">
                    <Link to="/blog" className="inline-flex items-center text-gray-500 hover:text-blue-600 mb-8 transition-colors">
                        <ArrowLeft size={20} className="mr-2" /> Back to Blog
                    </Link>

                    <header className="mb-8">
                        {post.featured_image && (
                            <img
                                src={post.featured_image}
                                alt={post.title}
                                className="w-full h-64 md:h-96 object-cover rounded-xl shadow-sm mb-8"
                            />
                        )}
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                            <span>{post.date}</span>
                            <span>•</span>
                            <span>By {post.author}</span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight">
                            {post.title}
                        </h1>
                    </header>

                    <div
                        className="prose prose-lg prose-blue max-w-none"
                        dangerouslySetInnerHTML={{ __html: post.content }}
                    />
                </div>
            </article>
        </MainLayout>
    );
};

export default BlogDetail;
