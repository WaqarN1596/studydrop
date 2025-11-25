import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Bell, LogOut, User, Settings, ChevronDown, Download } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!user) return null;

    return (
        <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link to="/dashboard" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <span className="text-white font-bold text-xl">S</span>
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
                            StudyDrop
                        </span>
                    </Link>

                    {/* Right side */}
                    <div className="flex items-center gap-4">
                        <ThemeToggle />

                        {/* Notifications */}
                        <Link
                            to="/notifications"
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors relative"
                        >
                            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                        </Link>

                        {/* User Menu */}
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all group"
                            >
                                {/* Avatar */}
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-600 to-purple-600 flex items-center justify-center text-white font-semibold group-hover:scale-110 transition-transform shadow-md">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>

                                {/* Name */}
                                <div className="hidden md:flex items-center gap-2">
                                    <div className="text-left">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                            {user.name}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {user.email}
                                        </p>
                                    </div>
                                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                                </div>
                            </button>

                            {/* Dropdown Menu */}
                            {showUserMenu && (
                                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{user.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                                    </div>

                                    <Link
                                        to="/profile"
                                        onClick={() => setShowUserMenu(false)}
                                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">My Profile</span>
                                    </Link>

                                    <Link
                                        to="/settings"
                                        onClick={() => setShowUserMenu(false)}
                                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">Settings</span>
                                    </Link>

                                    <Link
                                        to="/downloads"
                                        onClick={() => setShowUserMenu(false)}
                                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <Download className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">Downloads</span>
                                    </Link>

                                    <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

                                    <button
                                        onClick={() => {
                                            logout();
                                            setShowUserMenu(false);
                                            navigate('/');
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        <span className="text-sm font-medium">Sign Out</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
