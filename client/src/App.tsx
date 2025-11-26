import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useEffect, useState } from 'react';
import ProtectedRoute from './components/ProtectedRoute';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import ClassPage from './pages/ClassPage';
import JoinClass from './pages/JoinClass';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import Downloads from './pages/Downloads';
import DocumentViewer from './pages/DocumentViewer';

// Route change detector
function RouteChangeHandler() {
    const location = useLocation();
    const [isNavigating, setIsNavigating] = useState(false);

    useEffect(() => {
        setIsNavigating(true);
        const timer = setTimeout(() => setIsNavigating(false), 300);
        return () => clearTimeout(timer);
    }, [location.pathname]);

    if (!isNavigating) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-50">
            <div className="h-1 bg-gradient-to-r from-primary-600 via-purple-600 to-primary-600 animate-pulse"></div>
        </div>
    );
}

function App() {
    const { user } = useAuthStore();

    // Keep backend alive with periodic pings
    useEffect(() => {
        if (!user) return;

        const keepAlive = () => {
            const apiUrl = import.meta.env.VITE_API_URL || 'https://studydrop-api.onrender.com/api';
            fetch(`${apiUrl.replace('/api', '')}/health`, { method: 'GET' }).catch(() => { });
        };

        // Ping immediately on mount
        keepAlive();

        // Then ping every 5 minutes to keep server warm
        const interval = setInterval(keepAlive, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [user]);

    return (
        <BrowserRouter>
            <RouteChangeHandler />
            <Routes>
                <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Welcome />} />
                <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/onboarding" element={<Onboarding />} />

                <Route path="/dashboard" element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                } />

                <Route path="/classes/:id" element={
                    <ProtectedRoute>
                        <ClassPage />
                    </ProtectedRoute>
                } />

                <Route path="/classes/join" element={
                    <ProtectedRoute>
                        <JoinClass />
                    </ProtectedRoute>
                } />

                <Route path="/profile" element={
                    <ProtectedRoute>
                        <Profile />
                    </ProtectedRoute>
                } />

                <Route path="/settings" element={
                    <ProtectedRoute>
                        <Settings />
                    </ProtectedRoute>
                } />

                <Route path="/notifications" element={
                    <ProtectedRoute>
                        <Notifications />
                    </ProtectedRoute>
                } />

                <Route path="/downloads" element={
                    <ProtectedRoute>
                        <Downloads />
                    </ProtectedRoute>
                } />

                <Route path="/document/:id" element={
                    <ProtectedRoute>
                        <DocumentViewer />
                    </ProtectedRoute>
                } />

                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
