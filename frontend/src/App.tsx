import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { AuthInitializer } from './components/AuthInitializer';

function App() {
    return (
        <AuthInitializer>
            <RouterProvider router={router} />
        </AuthInitializer>
    );
}

export default App;