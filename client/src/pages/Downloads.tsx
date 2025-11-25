import { useEffect, useState } from 'react';
import { Download as DownloadIcon, ExternalLink, RefreshCw, Trash2, X } from 'lucide-react';
import Navbar from '../components/Navbar';
import { downloadApi, uploadApi } from '../services/api';
import PDFViewerModal from '../components/PDFViewerModal';
import ImageViewerModal from '../components/ImageViewerModal';
import Toast from '../components/Toast';

interface DownloadHistoryItem {
    id: number;
    downloaded_at: string;
    upload_id: number;
    title: string;
    original_filename: string;
    file_path: string;
    mime_type: string;
    file_size: number;
    category: string;
    class_name: string;
    class_code: string;
    uploader_name: string;
}

// Confirmation Modal Component
function ConfirmDeleteModal({
    filename,
    onConfirm,
    onCancel
}: {
    filename: string;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Delete File?</h3>
                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Are you sure you want to delete <span className="font-semibold text-gray-900 dark:text-white">"{filename}"</span>? This action cannot be undone.
                </p>

                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function Downloads() {
    const [downloads, setDownloads] = useState<DownloadHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewerFile, setViewerFile] = useState<{ url: string; filename: string; type: 'pdf' | 'image' } | null>(null);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; filename: string } | null>(null);

    useEffect(() => {
        fetchDownloads();
    }, []);

    const fetchDownloads = async () => {
        try {
            setLoading(true);
            const res = await downloadApi.getDownloadHistory();
            setDownloads(res.data.downloads);
        } catch (err) {
            console.error('Error fetching downloads:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleView = (download: DownloadHistoryItem) => {
        const isPDF = download.mime_type?.includes('pdf');
        // Use backend API URL for proxy
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://studydrop-api.onrender.com/api';
        const proxyUrl = `${apiBaseUrl}/proxy?url=${encodeURIComponent(download.file_path)}`;

        setViewerFile({
            url: isPDF ? proxyUrl : download.file_path,
            filename: download.title || download.original_filename,
            type: isPDF ? 'pdf' : 'image',
        });
    };

    const handleDownload = async (download: DownloadHistoryItem) => {
        try {
            // Track the download
            await downloadApi.trackDownload(download.upload_id);

            // Use backend API URL for proxy to force correct filename
            const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://studydrop-api.onrender.com/api';
            const proxyUrl = `${apiBaseUrl}/proxy?url=${encodeURIComponent(download.file_path)}&filename=${encodeURIComponent(download.original_filename)}&download=true`;

            // Fetch without auth header since proxy is public
            const response = await fetch(proxyUrl);

            if (!response.ok) throw new Error('Download failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = download.original_filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            setToastMessage('File downloaded.');
            setShowToast(true);
        } catch (err) {
            console.error('Error downloading file:', err);
            setToastMessage('Download failed.');
            setShowToast(true);
        }
    };

    const handleDeleteClick = (download: DownloadHistoryItem) => {
        setDeleteConfirm({
            id: download.upload_id,
            filename: download.title || download.original_filename,
        });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteConfirm) return;

        try {
            await uploadApi.deleteUpload(deleteConfirm.id);
            setToastMessage('File deleted successfully.');
            setShowToast(true);
            setDeleteConfirm(null);
            // Refresh downloads list
            fetchDownloads();
        } catch (err) {
            console.error('Error deleting file:', err);
            setToastMessage('Failed to delete file.');
            setShowToast(true);
            setDeleteConfirm(null);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const getFileIcon = (mimeType: string) => {
        if (mimeType?.includes('pdf')) return '📄';
        if (mimeType?.includes('image')) return '🖼️';
        if (mimeType?.includes('doc')) return '📝';
        return '📎';
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

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Download History</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Files you've downloaded from your classes
                    </p>
                </div>

                {/* Downloads List */}
                {downloads.length === 0 ? (
                    <div className="card text-center py-12">
                        <DownloadIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">No downloads yet</p>
                    </div>
                ) : (
                    <div className="card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            File
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Class
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Category
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Size
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Downloaded
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                    {downloads.map((download) => (
                                        <tr key={download.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <span className="text-2xl mr-3">{getFileIcon(download.mime_type)}</span>
                                                    <div>
                                                        <div className="text-sm font-medium">
                                                            {download.title || download.original_filename}
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            {download.original_filename}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium">{download.class_name}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">{download.class_code}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                                                    {download.category || 'Uncategorized'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {formatFileSize(download.file_size)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {new Date(download.downloaded_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleView(download)}
                                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                        title="View"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDownload(download)}
                                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                        title="Download Again"
                                                    >
                                                        <RefreshCw className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(download)}
                                                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <ConfirmDeleteModal
                    filename={deleteConfirm.filename}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setDeleteConfirm(null)}
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
            {showToast && <Toast message={toastMessage} onClose={() => setShowToast(false)} />}
        </div>
    );
}
