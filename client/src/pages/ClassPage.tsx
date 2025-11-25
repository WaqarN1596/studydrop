import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { classApi, downloadApi } from '../services/api';
import { Upload as UploadType } from '../types';
import { Upload, Search, Filter, X, LogOut, ExternalLink, Download as DownloadIcon } from 'lucide-react';
import Navbar from '../components/Navbar';
import UploadModal from '../components/UploadModal';
import PDFViewerModal from '../components/PDFViewerModal';
import ImageViewerModal from '../components/ImageViewerModal';
import Toast from '../components/Toast';

export default function ClassPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [classData, setClassData] = useState<any>(null);
    const [uploads, setUploads] = useState<UploadType[]>([]);
    const [filteredUploads, setFilteredUploads] = useState<UploadType[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [leaving, setLeaving] = useState(false);
    const [viewerFile, setViewerFile] = useState<{ url: string; filename: string; type: 'pdf' | 'image' } | null>(null);
    const [showToast, setShowToast] = useState(false);

    useEffect(() => {
        if (id) {
            Promise.all([
                classApi.getClass(parseInt(id)),
                classApi.getClassUploads(parseInt(id)),
            ]).then(([classRes, uploadsRes]) => {
                setClassData(classRes.data.class);
                setUploads(uploadsRes.data.uploads);
                setFilteredUploads(uploadsRes.data.uploads);
                setLoading(false);
            });
        }
    }, [id]);

    // Filter uploads whenever search or category changes
    useEffect(() => {
        let filtered = uploads;

        // Filter by search query
        if (searchQuery) {
            filtered = filtered.filter(u =>
                (u.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (u.originalFilename || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (u.summary || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        // Filter by category
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(u => u.category === selectedCategory);
        }

        setFilteredUploads(filtered);
    }, [searchQuery, selectedCategory, uploads]);

    const handleUploadComplete = () => {
        if (id) {
            classApi.getClassUploads(parseInt(id)).then((res) => {
                setUploads(res.data.uploads);
            });
        }
        setShowUploadModal(false);
    };

    const handleLeaveClass = async () => {
        if (!id || !confirm('Are you sure you want to leave this class?')) return;

        setLeaving(true);
        try {
            await classApi.leaveClass({ classId: parseInt(id) });
            navigate('/dashboard');
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to leave class');
        } finally {
            setLeaving(false);
        }
    };

    const handleView = (upload: UploadType) => {
        const isPDF = upload.mimeType?.includes('pdf');
        // Use backend API URL for proxy to avoid CORS issues with PDF.js worker
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://studydrop-api.onrender.com/api';
        const proxyUrl = `${apiBaseUrl}/proxy?url=${encodeURIComponent(upload.url)}`;

        setViewerFile({
            url: isPDF ? proxyUrl : upload.url, // Images usually work fine without proxy, but PDF needs it
            filename: upload.title || upload.originalFilename,
            type: isPDF ? 'pdf' : 'image',
        });
    };

    const handleDownload = async (upload: UploadType) => {
        try {
            // Track the download
            await downloadApi.trackDownload(upload.id);

            // Use backend API URL for proxy to force correct filename
            const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://studydrop-api.onrender.com/api';
            const proxyUrl = `${apiBaseUrl}/proxy?url=${encodeURIComponent(upload.url)}&filename=${encodeURIComponent(upload.originalFilename)}&download=true`;

            // Fetch without auth header since proxy is public
            const response = await fetch(proxyUrl);

            if (!response.ok) throw new Error('Download failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = upload.originalFilename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            setShowToast(true);
        } catch (err) {
            console.error('Error downloading file:', err);
            alert('Failed to download file. Please try again.');
        }
    };

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedCategory('all');
    };

    // Get unique categories from uploads
    const categories = Array.from(new Set(uploads.map(u => u.category).filter(Boolean)));

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

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header with Leave Button */}
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">{classData?.name}</h1>
                        <p className="text-gray-600 dark:text-gray-400">{classData?.code}</p>
                    </div>
                    <button
                        onClick={handleLeaveClass}
                        disabled={leaving}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                        <LogOut className="w-4 h-4" />
                        {leaving ? 'Leaving...' : 'Leave Class'}
                    </button>
                </div>

                {/* Upload Section */}
                <div className="card mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold mb-1">Upload Materials</h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Share exams, notes, homework, and other study materials
                            </p>
                        </div>
                        <button onClick={() => setShowUploadModal(true)} className="btn-primary flex items-center gap-2">
                            <Upload className="w-4 h-4" />
                            Upload File
                        </button>
                    </div>
                </div>

                {/* Search and Filter Bar */}
                <div className="card mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by title, description, or tags..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="input pl-10 pr-10"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Category Filter */}
                        <div className="md:w-64">
                            <div className="relative">
                                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="input pl-10 appearance-none"
                                >
                                    <option value="all">All Categories</option>
                                    {categories.map((category) => (
                                        <option key={category} value={category}>
                                            {(category || "").charAt(0).toUpperCase() + (category || "").slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Clear Filters */}
                        {(searchQuery || selectedCategory !== 'all') && (
                            <button
                                onClick={clearFilters}
                                className="btn-secondary whitespace-nowrap"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>

                    {/* Results Count */}
                    <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                        Showing {filteredUploads.length} of {uploads.length} files
                    </div>
                </div>

                {/* Files Uploaded Section */}
                <div className="mb-4">
                    <h2 className="text-2xl font-bold">Files Uploaded</h2>
                </div>

                {/* Uploads Grid */}
                {filteredUploads.length === 0 ? (
                    <div className="card text-center py-12">
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                            {uploads.length === 0 ? 'No files uploaded yet' : 'No files match your filters'}
                        </p>
                        {uploads.length > 0 && (
                            <button onClick={clearFilters} className="text-primary-600 hover:underline text-sm">
                                Clear filters to see all files
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredUploads.map((upload) => (
                            <div key={upload.id} className="card-hover group">
                                <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg mb-4 flex items-center justify-center overflow-hidden relative">
                                    {upload.mimeType?.includes('pdf') ? (
                                        <div className="text-center">
                                            <div className="text-4xl mb-2">📄</div>
                                            <span className="text-sm text-gray-600 dark:text-gray-400">PDF</span>
                                        </div>
                                    ) : (
                                        <img src={upload.url} alt={upload.title || ''} className="w-full h-full object-cover" />
                                    )}

                                    {/* Hover Overlay */}
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                        <button
                                            onClick={() => handleView(upload)}
                                            className="p-2 bg-white rounded-full text-gray-900 hover:bg-primary-50 transition-colors"
                                            title="View File"
                                        >
                                            <ExternalLink className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDownload(upload)}
                                            className="p-2 bg-white rounded-full text-gray-900 hover:bg-primary-50 transition-colors"
                                            title="Download File"
                                        >
                                            <DownloadIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="font-semibold line-clamp-2 flex-1">
                                        {upload.title || upload.originalFilename}
                                    </h3>
                                    {upload.category && (
                                        <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-full whitespace-nowrap">
                                            {upload.category}
                                        </span>
                                    )}
                                </div>

                                {upload.summary && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                                        {upload.summary}
                                    </p>
                                )}

                                {upload.tags && upload.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {upload.tags.slice(0, 3).map((tag, idx) => (
                                            <span
                                                key={idx}
                                                className="px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-xs rounded-full"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                        {upload.tags.length > 3 && (
                                            <span className="text-xs text-gray-500">+{upload.tags.length - 3} more</span>
                                        )}
                                    </div>
                                )}

                                <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t border-gray-200 dark:border-gray-700">
                                    <span>{upload.uploaderName}</span>
                                    <div className="flex gap-2 items-center">
                                        <span>{new Date(upload.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showUploadModal && (
                <UploadModal
                    classId={parseInt(id!)}
                    onClose={() => setShowUploadModal(false)}
                    onComplete={handleUploadComplete}
                />
            )}

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

            {/* Toast */}
            {showToast && <Toast message="File downloaded." onClose={() => setShowToast(false)} />}
        </div>
    );
}
