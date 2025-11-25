import { useEffect, useState } from 'react';
import { notificationApi } from '../services/api';
import { Notification } from '../types';
import { Bell, CheckCircle } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function Notifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        notificationApi.getNotifications().then((res) => {
            setNotifications(res.data.notifications);
            setLoading(false);
        });
    }, []);

    const handleMarkAsRead = async (id: number) => {
        await notificationApi.markAsRead(id);
        setNotifications(notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
        ));
    };

    const handleMarkAllAsRead = async () => {
        await notificationApi.markAllAsRead();
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };

    if (loading) {
        return (
            <div>
                <Navbar />
                <div className="flex items-center justify-center h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Navbar />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Notifications</h1>
                    {notifications.some(n => !n.read) && (
                        <button onClick={handleMarkAllAsRead} className="text-primary-600 hover:underline text-sm">
                            Mark all as read
                        </button>
                    )}
                </div>

                {notifications.length === 0 ? (
                    <div className="card text-center py-12">
                        <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">No notifications yet</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`card ${!notification.read ? 'border-l-4 border-primary-600' : ''}`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${notification.type === 'new_upload'
                                                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                                                    : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                                                }`}>
                                                {notification.type.replace('_', ' ')}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {new Date(notification.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-gray-800 dark:text-gray-200">
                                            {notification.data?.message || 'New notification'}
                                        </p>
                                    </div>
                                    {!notification.read && (
                                        <button
                                            onClick={() => handleMarkAsRead(notification.id)}
                                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                            title="Mark as read"
                                        >
                                            <CheckCircle className="w-5 h-5 text-primary-600" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
