import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { userApi } from '../services/api';
import { User as UserIcon, Mail, GraduationCap, Calendar, Upload, TrendingUp, Award, Edit, Eye, Filter } from 'lucide-react';
import Navbar from '../components/Navbar';
import PDFViewerModal from '../components/PDFViewerModal';
import ImageViewerModal from '../components/ImageViewerModal';

export default function Profile() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [uploads, setUploads] = useState<any[]>([]);
    const [filteredUploads, setFilteredUploads] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [stats, setStats] = useState({ totalUploads: 0, totalClasses: 0, recentActivity: 0 });
    const [loading, setLoading] = useState(true);
    const [viewerFile, setViewerFile] = useState<{ url: string; filename: string; type: 'pdf' | 'image' } | null>(null);

    // Filters
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [classFilter, setClassFilter] = useState('all');

    useEffect(() => {
        if (user) {
            Promise.all([
                userApi.getUserUploads(user.id),
                userApi.getUserClasses(user.id),
            ]).then(([uploadsRes, classesRes]) => {
                const userUploads = uploadsRes.data.uploads;

                // Debug: Log what we received
                if (userUploads && userUploads.length > 0) {
                    console.log('=== PROFILE DEBUG ===');
                    console.log('First upload received:', userUploads[0]);
                    console.log('Has created_at?', userUploads[0].created_at);
                    console.log('Has file_path?', userUploads[0].file_path);
                    console.log('Has mime_type?', userUploads[0].mime_type);
                }

                setUploads(userUploads);
                setFilteredUploads(userUploads);
                setClasses(classesRes.data.classes);

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

    // Apply filters
    useEffect(() => {
        let filtered = uploads;

        if (categoryFilter !== 'all') {
            filtered = filtered.filter(u => u.category === categoryFilter);
        }

        if (classFilter !== 'all') {
            filtered = filtered.filter(u => u.classId === parseInt(classFilter));
        }

        setFilteredUploads(filtered);
    }, [categoryFilter, classFilter, uploads]);

    const handleView = (upload: any) => {
        // Backend returns file_path and mime_type (snake_case)
        // file_path is already a signed URL from the backend, use it directly
        const fileUrl = upload.file_path || upload.url;
        const mimeType = upload.mime_type || upload.mimeType;
        const isPDF = mimeType?.includes('pdf');

        setViewerFile({
            url: fileUrl, // Use signed URL directly, no need to proxy
            filename: upload.title || upload.original_filename || upload.originalFilename,
            type: isPDF ? 'pdf' : 'image',
        });
    };

    const categories = ['all', 'exam', 'quiz', 'homework', 'notes', 'lab', 'project', 'other'];

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
                        <button
                            onClick={() => navigate('/settings')}
                            className="btn-secondary bg-white/20 backdrop-blur-sm hover:bg-white/30 border-white/30 text-white flex items-center gap-2"
                        >
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
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <Award className="w-7 h-7 text-primary-600" />
                            My Contributions ({filteredUploads.length})
                        </h2>

                        {/* Filters */}
                        <div className="flex flex-wrap gap-3">
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-gray-500" />
                                <select
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    className="input py-1 px-3 text-sm"
                                >
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>
                                            {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <select
                                value={classFilter}
                                onChange={(e) => setClassFilter(e.target.value)}
                                className="input py-1 px-3 text-sm"
                            >
                                <option value="all">All Classes</option>
                                {classes.map(cls => (
                                    <option key={cls.id} value={cls.id}>
                                        {cls.code} - {cls.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {filteredUploads.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
                            <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 dark:text-gray-400">
                                {uploads.length === 0 ? 'No uploads yet' : 'No uploads match the selected filters'}
                            </p>
                            {uploads.length === 0 && (
                                <p className="text-sm text-gray-500 mt-2">Start contributing to help your classmates!</p>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredUploads.map((upload) => (
                                <div
                                    key={upload.id}
                                    onClick={() => handleView(upload)}
                                    className="card-hover bg-gray-50 dark:bg-gray-800/50 p-4 cursor-pointer group"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex gap-4 flex-1">
                                            <div className="w-14 h-14 bg-gradient-to-br from-primary-100 to-purple-100 dark:from-primary-900 dark:to-purple-900 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                                <Upload className="w-7 h-7 text-primary-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-semibold line-clamp-1 group-hover:text-primary-600 transition-colors">
                                                        {upload.title || upload.original_filename || upload.originalFilename}
                                                    </h3>
                                                    <Eye className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                                <p className="text-sm text-primary-600 dark:text-primary-400 font-medium mb-2">
                                                    {upload.class_name || upload.className}
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
                                            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                                                {new Date(upload.created_at || upload.createdAt).toLocaleDateString()}
                                            </span>
                                            {upload.category && (
                                                <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full inline-block">
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

            {/* Viewers */}
            {viewerFile && viewerFile.type === 'pdf' && (
                <PDFViewerModal
                    url={viewerFile.url}
                    filename={viewerFile.filename}
                    onClose={() => setViewerFile(null)}
                />
            )}
            {viewerFile && viewerFile.type === 'image' && (
                <ImageViewerModal
                    url={viewerFile.url}
                    filename={viewerFile.filename}
                    onClose={() => setViewerFile(null)}
                />
            )}
        </div>
    );
}
