import { Link } from 'react-router-dom';

export function NotFoundPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="text-center max-w-sm">
                <p className="text-5xl font-bold text-indigo-200 mb-2">404</p>
                <h1 className="text-lg font-bold mb-2">Sayfa Bulunamadı</h1>
                <p className="text-sm text-gray-500 mb-4">
                    Aradığınız sayfa taşınmış, silinmiş olabilir ya da hiç var olmamış olabilir.
                </p>
                <Link to="/dashboard" className="text-indigo-600 hover:underline text-sm">
                    ← Dashboard'a dön
                </Link>
            </div>
        </div>
    );
}