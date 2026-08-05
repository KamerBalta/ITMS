import { useRouteError, useNavigate, isRouteErrorResponse } from 'react-router-dom';

export function RouteErrorPage() {
    const error = useRouteError();
    const navigate = useNavigate();

    const message = isRouteErrorResponse(error)
        ? `${error.status} — ${error.statusText}`
        : error instanceof Error
            ? error.message
            : 'Beklenmeyen bir hata oluştu.';

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="text-center max-w-sm">
                <p className="text-4xl mb-3">⚠️</p>
                <h1 className="text-lg font-bold mb-2">Bir şeyler ters gitti</h1>
                <p className="text-sm text-gray-500 mb-4">{message}</p>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700"
                >
                    Ana Sayfaya Dön
                </button>
            </div>
        </div>
    );
}