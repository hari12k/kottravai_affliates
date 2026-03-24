import { Link } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';

const NotFound = () => {
    return (
        <MainLayout>
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <h1 className="text-9xl font-bold text-gray-200">404</h1>
                <h2 className="text-3xl font-bold text-gray-900 mt-4">Page Not Found</h2>
                <p className="text-gray-600 mt-2 mb-8">The page you are looking for does not exist.</p>
                <Link
                    to="/"
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition"
                >
                    Go Back Home
                </Link>
            </div>
        </MainLayout>
    );
};

export default NotFound;
