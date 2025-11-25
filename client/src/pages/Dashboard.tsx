import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { userApi, classApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Class, Upload } from '../types';
import { BookOpen, FileText, TrendingUp, Plus, Clock, Award, Star, Activity } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function Dashboard() {
    const { user } = useAuthStore();
    const [classes, setClasses] = useState<Class[]>([]);
    const [recentUploads, setRecentUploads] = useState<Upload[]>([]);
    const [myUploadsCount, setMyUploadsCount] = useState(0);
    const [totalFilesCount, setTotalFilesCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            try {
                const [classesRes, uploadsRes] = await Promise.all([
                    userApi.getUserClasses(user.id),
                    userApi.getUserUploads(user.id),
                ]);

                setClasses(classesRes.data.classes);
                const userUploads = uploadsRes.data.uploads;
                setMyUploadsCount(userUploads.length);

                // Get recent uploads from all classes
                if (classesRes.data.classes.length > 0) {
                    const uploadsPromises = classesRes.data.classes.map((cls: Class) =>
                        classApi.getClassUploads(cls.id)
                    );

                    const uploadsResults = await Promise.all(uploadsPromises);
                    const allUploads: Upload[] = [];

                    uploadsResults.forEach(res => {
                        if (res.data.uploads) {
                            allUploads.push(...res.data.uploads);
                        }
                    });

                    // Sort by date and take top 6
                    const sorted = allUploads.sort((a, b) =>
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    );
                    setRecentUploads(sorted.slice(0, 6));
                    setTotalFilesCount(allUploads.length);
                }
            } catch (error) {
                console.error('Error loading dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
                        Welcome back, {user?.name?.split(' ')[0]}! 👋
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                        Here's what's happening in your classes today
                    </p>
                </div>

                {/* Enhanced Stats Grid */}
                <div className="grid md:grid-cols-4 gap-6 mb-8">
                    <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:shadow-2xl transition-all">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-blue-100 mb-1">Enrolled Classes</p>
                                <p className="text-4xl font-bold">{classes.length}</p>
                            </div>
                            <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl">
                                <BookOpen className="w-8 h-8" />
                            </div>
                        </div>
                    </div>

                    <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white hover:shadow-2xl transition-all">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-green-100 mb-1">Your Uploads</p>
                                <p className="text-4xl font-bold">{myUploadsCount}</p>
                            </div>
                            <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl">
                                <FileText className="w-8 h-8" />
                            </div>
                        </div>
                    </div>

                    <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white hover:shadow-2xl transition-all">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-purple-100 mb-1">Total Files</p>
                                <p className="text-4xl font-bold">{totalFilesCount}</p>
                            </div>
                            <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl">
                                <TrendingUp className="w-8 h-8" />
                            </div>
                        </div>
                    </div>

                    <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white hover:shadow-2xl transition-all">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-orange-100 mb-1">Contribution</p>
                                <div className="flex items-center gap-1">
                                    <p className="text-4xl font-bold">{myUploadsCount > 10 ? 'A+' : myUploadsCount > 5 ? 'A' : 'B+'}</p>
                                    <Award className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl">
                                <Star className="w-8 h-8" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* My Classes - Takes 2 columns */}
                    <div className="lg:col-span-2">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <BookOpen className="w-7 h-7 text-primary-600" />
                                My Classes
                            </h2>
                            <Link to="/classes/join" className="text-primary-600 hover:underline text-sm font-medium flex items-center gap-1">
                                <Plus className="w-4 h-4" />
                                Join Class
                            </Link>
                        </div>

                        {classes.length === 0 ? (
                            <div className="card text-center py-16 bg-gradient-to-br from-primary-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 border-2 border-dashed border-primary-300 dark:border-primary-700">
                                <BookOpen className="w-16 h-16 text-primary-400 mx-auto mb-4" />
                                <p className="text-gray-600 dark:text-gray-400 mb-4 text-lg">You haven't joined any classes yet</p>
                                <Link to="/classes/join" className="btn-primary inline-flex items-center gap-2">
                                    <Plus className="w-4 h-4" />
                                    Join Your First Class
                                </Link>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-4">
                                {classes.map((cls) => (
                                    <Link
                                        key={cls.id}
                                        to={`/classes/${cls.id}`}
                                        className="card-hover bg-white dark:bg-gray-800 border-l-4 border-primary-500 hover:border-primary-600 transition-all group"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg group-hover:scale-110 transition-transform">
                                                <BookOpen className="w-5 h-5 text-primary-600" />
                                            </div>
                                            <span className="text-xs font-semibold text-primary-600 bg-primary-100 dark:bg-primary-900 px-2 py-1 rounded-full">
                                                {cls.code}
                                            </span>
                                        </div>
                                        <h3 className="font-semibold text-lg mb-2 group-hover:text-primary-600 transition-colors">
                                            {cls.name}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {cls.semester || 'Fall 2024'}
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Recent Activity - Takes 1 column */}
                    <div>
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            <Activity className="w-7 h-7 text-primary-600" />
                            Recent Activity
                        </h2>

                        {recentUploads.length === 0 ? (
                            <div className="card text-center py-12 bg-gray-50 dark:bg-gray-800">
                                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600 dark:text-gray-400">No recent activity</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentUploads.map((upload) => (
                                    <div key={upload.id} className="card-hover bg-white dark:bg-gray-800 p-4">
                                        <div className="flex gap-3">
                                            <div className="flex-shrink-0">
                                                <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-purple-100 dark:from-primary-900 dark:to-purple-900 rounded-lg flex items-center justify-center">
                                                    <FileText className="w-6 h-6 text-primary-600" />
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-sm mb-1 line-clamp-1">
                                                    {upload.title || upload.originalFilename}
                                                </h4>
                                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                                    {upload.className}
                                                </p>
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <Clock className="w-3 h-3" />
                                                    <span>{new Date(upload.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        {upload.tags && upload.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {upload.tags.slice(0, 2).map((tag, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="px-2 py-0.5 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs rounded-full"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions Footer */}
                <div className="mt-8 card bg-gradient-to-r from-primary-600 to-purple-600 text-white">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div>
                            <h3 className="text-xl font-semibold mb-1">Ready to contribute?</h3>
                            <p className="text-sm text-primary-100">Share your study materials and help your classmates succeed</p>
                        </div>
                        <Link
                            to={classes.length > 0 ? `/classes/${classes[0].id}` : '/classes/join'}
                            className="bg-white text-primary-600 hover:bg-primary-50 px-6 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap"
                        >
                            {classes.length > 0 ? 'Upload Files' : 'Join a Class First'}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
