import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import pagesData from '@/data/pages.json';
import MainLayout from '@/layouts/MainLayout';
import NotFound from '@/pages/NotFound';


const PageViewer = ({ slugUri }: { slugUri?: string }) => {
    const { slug: paramSlug } = useParams();
    const currentSlug = slugUri || paramSlug;

    const page = pagesData.find(p => p.slug === currentSlug);

    if (!page) {
        return <NotFound />;
    }

    return (
        <MainLayout>
            <Helmet>
                <title>{page.meta_title || page.title}</title>
                <meta name="description" content={page.meta_description || ''} />
            </Helmet>

            {page.featured_image && (
                <div className="w-full h-64 md:h-96 relative">
                    <img
                        src={page.featured_image}
                        alt={page.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <h1 className="text-4xl md:text-5xl font-bold text-white text-center px-4">
                            {page.title}
                        </h1>
                    </div>
                </div>
            )}

            <div className={`container mx-auto px-4 py-8 ${!page.featured_image ? 'mt-8' : ''}`}>
                {!page.featured_image && (
                    <h1 className="text-4xl font-bold mb-8 text-center">{page.title}</h1>
                )}

                {/* Render HTML Content from Data */}
                <div
                    className="prose prose-lg max-w-none text-gray-700"
                    dangerouslySetInnerHTML={{ __html: page.content }}
                />
            </div>
        </MainLayout>
    );
};

export default PageViewer;
