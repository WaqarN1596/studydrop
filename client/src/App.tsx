import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
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

function App() {
    const { user } = useAuthStore();

    return (
        <BrowserRouter>
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

                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
