import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { Settings as SettingsIcon, User, Bell, Lock, Palette, Moon, Sun, Shield, Mail, Save } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function Settings() {
    const { user } = useAuthStore();
    const { theme, toggleTheme } = useThemeStore();
    const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'privacy' | 'appearance'>('profile');

    // Mock settings state
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [uploadNotifications, setUploadNotifications] = useState(true);
    const [commentNotifications, setCommentNotifications] = useState(true);

    const tabs = [
        { id: 'profile' as const, label: 'Profile', icon: User },
        { id: 'notifications' as const, label: 'Notifications', icon: Bell },
        { id: 'privacy' as const, label: 'Privacy & Security', icon: Lock },
        { id: 'appearance' as const, label: 'Appearance', icon: Palette },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
            <Navbar />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-primary-600 to-purple-600 rounded-2xl">
                            <SettingsIcon className="w-8 h-8 text-white" />
                        </div>
                        Settings
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                        Manage your account preferences and settings
                    </p>
                </div>

                <div className="grid lg:grid-cols-4 gap-6">
                    {/* Sidebar Navigation */}
                    <div className="lg:col-span-1">
                        <div className="card p-2 space-y-1">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === tab.id
                                                ? 'bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-lg'
                                                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                                            }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span className="font-medium">{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="lg:col-span-3">
                        <div className="card">
                            {/* Profile Settings */}
                            {activeTab === 'profile' && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold mb-4">Profile Information</h2>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Full Name</label>
                                        <input
                                            type="text"
                                            defaultValue={user?.name}
                                            className="input"
                                            placeholder="Your name"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Email</label>
                                        <input
                                            type="email"
                                            defaultValue={user?.email}
                                            className="input"
                                            placeholder="your.email@example.com"
                                            disabled
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Major</label>
                                        <input
                                            type="text"
                                            defaultValue={user?.major || ''}
                                            className="input"
                                            placeholder="Computer Science"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Year</label>
                                        <select className="input" defaultValue={user?.year || ''}>
                                            <option value="">Select year</option>
                                            <option value="1">Freshman</option>
                                            <option value="2">Sophomore</option>
                                            <option value="3">Junior</option>
                                            <option value="4">Senior</option>
                                            <option value="5">Graduate</option>
                                        </select>
                                    </div>

                                    <button className="btn-primary flex items-center gap-2">
                                        <Save className="w-4 h-4" />
                                        Save Changes
                                    </button>
                                </div>
                            )}

                            {/* Notifications Settings */}
                            {activeTab === 'notifications' && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold mb-4">Notification Preferences</h2>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <Mail className="w-5 h-5 text-primary-600" />
                                                <div>
                                                    <p className="font-medium">Email Notifications</p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        Receive email updates about your activity
                                                    </p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={emailNotifications}
                                                    onChange={(e) => setEmailNotifications(e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <Bell className="w-5 h-5 text-primary-600" />
                                                <div>
                                                    <p className="font-medium">New Upload Notifications</p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        Get notified when files are uploaded to your classes
                                                    </p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={uploadNotifications}
                                                    onChange={(e) => setUploadNotifications(e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <User className="w-5 h-5 text-primary-600" />
                                                <div>
                                                    <p className="font-medium">Comment Notifications</p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        Get notified when someone comments on your uploads
                                                    </p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={commentNotifications}
                                                    onChange={(e) => setCommentNotifications(e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Privacy Settings */}
                            {activeTab === 'privacy' && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold mb-4">Privacy & Security</h2>

                                    <div className="space-y-4">
                                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                            <div className="flex items-center gap-3 mb-3">
                                                <Lock className="w-5 h-5 text-primary-600" />
                                                <h3 className="font-medium">Change Password</h3>
                                            </div>
                                            <input type="password" placeholder="Current password" className="input mb-3" />
                                            <input type="password" placeholder="New password" className="input mb-3" />
                                            <input type="password" placeholder="Confirm new password" className="input mb-3" />
                                            <button className="btn-primary">Update Password</button>
                                        </div>

                                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                                            <div className="flex items-center gap-3 mb-3">
                                                <Shield className="w-5 h-5 text-red-600" />
                                                <h3 className="font-medium text-red-900 dark:text-red-200">Danger Zone</h3>
                                            </div>
                                            <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                                                Once you delete your account, there is no going back. Please be certain.
                                            </p>
                                            <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                                                Delete Account
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Appearance Settings */}
                            {activeTab === 'appearance' && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold mb-4">Appearance</h2>

                                    <div className="space-y-4">
                                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                            <div className="flex items-center gap-3 mb-4">
                                                <Palette className="w-5 h-5 text-primary-600" />
                                                <h3 className="font-medium">Theme</h3>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <button
                                                    onClick={() => theme === 'dark' && toggleTheme()}
                                                    className={`p-4 rounded-xl border-2 transition-all ${theme === 'light'
                                                            ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                                                            : 'border-gray-200 dark:border-gray-700 hover:border-primary-400'
                                                        }`}
                                                >
                                                    <Sun className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                                                    <p className="font-medium text-center">Light Mode</p>
                                                </button>

                                                <button
                                                    onClick={() => theme === 'light' && toggleTheme()}
                                                    className={`p-4 rounded-xl border-2 transition-all ${theme === 'dark'
                                                            ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                                                            : 'border-gray-200 dark:border-gray-700 hover:border-primary-400'
                                                        }`}
                                                >
                                                    <Moon className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                                                    <p className="font-medium text-center">Dark Mode</p>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                                <strong>Tip:</strong> You can quickly toggle between light and dark mode using the theme button in the navbar.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
