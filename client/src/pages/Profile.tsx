import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { userApi } from '../services/api';
import { User as UserIcon, Mail, GraduationCap, Calendar, Upload, TrendingUp, Award, Edit } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function Profile() {
    const { user } = useAuthStore();
    const [uploads, setUploads] = useState<any[]>([]);
    const [stats, setStats] = useState({ totalUploads: 0, totalClasses: 0, recentActivity: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            Promise.all([
                userApi.getUserUploads(user.id),
                userApi.getUserClasses(user.id),
            ]).then(([uploadsRes, classesRes]) => {
                const userUploads = uploadsRes.data.uploads;
                setUploads(userUploads);

                // Calculate stats
                const recentCount = userUploads.filter((u: any) => {
                    const uploadDate = new Date(u.createdAt);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return uploadDate > weekAgo;
                }).length;

                setStats({
                    totalUploads: userUploads.length,
                    totalClasses: classesRes.data.classes.length,
                    recentActivity: recentCount,
                });
                setLoading(false);
            });
        }
    }, [user]);

    if (loading || !user) {
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

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Profile Header */}
                <div className="card bg-gradient-to-br from-primary-600 to-purple-600 text-white mb-8 relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/10"></div>
                    <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6">
                        {/* Avatar */}
                        <div className="w-32 h-32 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-6xl font-bold border-4 border-white/30 shadow-2xl">
                            {user.name.charAt(0).toUpperCase()}
                        </div>

                        {/* User Info */}
                        <div className="flex-1 text-center md:text-left">
                            <h1 className="text-4xl font-bold mb-2">{user.name}</h1>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-white/90 justify-center md:justify-start">
                                    <Mail className="w-4 h-4" />
                                    <span>{user.email}</span>
                                </div>
                                {user.major && (
                                    <div className="flex items-center gap-2 text-white/90 justify-center md:justify-start">
                                        <GraduationCap className="w-4 h-4" />
                                        <span>{user.major}</span>
                                    </div>
                                )}
                                {user.year && (
                                    <div className="flex items-center gap-2 text-white/90 justify-center md:justify-start">
                                        <Calendar className="w-4 h-4" />
                                        <span>Year {user.year}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Edit Button */}
                        <button className="btn-secondary bg-white/20 backdrop-blur-sm hover:bg-white/30 border-white/30 text-white flex items-center gap-2">
                            <Edit className="w-4 h-4" />
                            Edit Profile
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-blue-100 mb-1">Total Uploads</p>
                                <p className="text-4xl font-bold">{stats.totalUploads}</p>
                            </div>
                            <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl">
                                <Upload className="w-8 h-8" />
                            </div>
                        </div>
                    </div>

                    <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-green-100 mb-1">Enrolled Classes</p>
                                <p className="text-4xl font-bold">{stats.totalClasses}</p>
                            </div>
                            <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl">
                                <GraduationCap className="w-8 h-8" />
                            </div>
                        </div>
                    </div>

                    <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-purple-100 mb-1">This Week</p>
                                <p className="text-4xl font-bold">{stats.recentActivity}</p>
                            </div>
                            <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl">
                                <TrendingUp className="w-8 h-8" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Upload History */}
                <div className="card">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <Award className="w-7 h-7 text-primary-600" />
                            My Contributions ({uploads.length})
                        </h2>
                    </div>

                    {uploads.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
                            <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 dark:text-gray-400">No uploads yet</p>
                            <p className="text-sm text-gray-500 mt-2">Start contributing to help your classmates!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {uploads.map((upload) => (
                                <div key={upload.id} className="card-hover bg-gray-50 dark:bg-gray-800/50 p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex gap-4 flex-1">
                                            <div className="w-14 h-14 bg-gradient-to-br from-primary-100 to-purple-100 dark:from-primary-900 dark:to-purple-900 rounded-xl flex items-center justify-center flex-shrink-0">
                                                <Upload className="w-7 h-7 text-primary-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold mb-1 line-clamp-1">
                                                    {upload.title || upload.originalFilename}
                                                </h3>
                                                <p className="text-sm text-primary-600 dark:text-primary-400 font-medium mb-2">
                                                    {upload.className}
                                                </p>
                                                {upload.tags && upload.tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {upload.tags.map((tag: string, idx: number) => (
                                                            <span
                                                                key={idx}
                                                                className="px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-xs rounded-full"
                                                            >
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right ml-4">
                                            <span className="text-xs text-gray-500 dark:text-gray-400 block">
                                                {new Date(upload.createdAt).toLocaleDateString()}
                                            </span>
                                            {upload.category && (
                                                <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full mt-1 inline-block">
                                                    {upload.category}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
