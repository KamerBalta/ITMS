import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
    children: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Prod ortaminda burada bir loglama servisine (Sentry vb.) gonderim yapilabilir.
        console.error('Yakalanmamış hata:', error, errorInfo);
    }

    handleReload = () => {
        this.setState({ hasError: false, error: null });
        window.location.href = '/dashboard';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                    <div className="text-center max-w-sm">
                        <p className="text-4xl mb-3">⚠️</p>
                        <h1 className="text-lg font-bold mb-2">Bir şeyler ters gitti</h1>
                        <p className="text-sm text-gray-500 mb-4">
                            Beklenmeyen bir hata oluştu. Sorun devam ederse yöneticinizle iletişime geçin.
                        </p>
                        <button
                            onClick={this.handleReload}
                            className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700"
                        >
                            Ana Sayfaya Dön
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}