import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { AuthInitializer } from './components/AuthInitializer';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
    return (
        <ErrorBoundary>
            <AuthInitializer>
                <RouterProvider router={router} />
            </AuthInitializer>
        </ErrorBoundary>
    );
}

export default App;