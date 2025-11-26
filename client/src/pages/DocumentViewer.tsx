import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, MessageSquare, FileText } from 'lucide-react';
import { uploadsApi, commentsApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

interface Upload {
    id: number;
    title: string;
    original_filename: string;
    url: string;  // Backend returns this as "url", not "file_path"
    mime_type: string;
    category: string;
    summary: string;
    created_at: string;
    class_name?: string;
}

interface Comment {
    id: number;
    upload_id: number;
    user_id: number;
    content: string;
    created_at: string;
    user_name: string;
}

export default function DocumentViewer() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const [upload, setUpload] = useState<Upload | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadingComments, setLoadingComments] = useState(true);
    const [postingComment, setPostingComment] = useState(false);
    const [activeTab, setActiveTab] = useState<'document' | 'comments'>('document');

    // Fetch upload details
    useEffect(() => {
        if (!id) return;

        setLoading(true);
        uploadsApi.getUploadById(parseInt(id))
            .then(res => {
                console.log('=== DOCUMENT VIEWER DEBUG ===');
                console.log('Upload data received:', res.data.upload);
                console.log('URL:', res.data.upload?.url);
                console.log('MIME type:', res.data.upload?.mime_type);
                setUpload(res.data.upload);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch upload:', err);
                setLoading(false);
            });
    }, [id]);

    // Fetch comments
    useEffect(() => {
        if (!id) return;

        setLoadingComments(true);
        commentsApi.getUploadComments(parseInt(id))
            .then(res => {
                setComments(res.data.comments || []);
                setLoadingComments(false);
            })
            .catch(err => {
                console.error('Failed to fetch comments:', err);
                setLoadingComments(false);
            });
    }, [id]);

    const handlePostComment = async () => {
        if (!newComment.trim() || !id) return;

        setPostingComment(true);
        try {
            const res = await commentsApi.createComment(parseInt(id), newComment);
            setComments([...comments, res.data.comment]);
            setNewComment('');
        } catch (err) {
            console.error('Failed to post comment:', err);
        } finally {
            setPostingComment(false);
        }
    };

    const handleDeleteComment = async (commentId: number) => {
        try {
            await commentsApi.deleteComment(commentId);
            setComments(comments.filter(c => c.id !== commentId));
        } catch (err) {
            console.error('Failed to delete comment:', err);
        }
    };

    const handleDownload = () => {
        if (!upload) return;
        window.open(upload.url, '_blank');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading document...</p>
                </div>
            </div>
        );
    }

    if (!upload) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 dark:text-gray-400">Document not found</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="mt-4 text-primary-600 hover:text-primary-700"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const isPDF = upload.mime_type?.includes('pdf');

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
                <div className="max-w-screen-2xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate(-1)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                                    {upload.title || upload.original_filename}
                                </h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {upload.class_name}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleDownload}
                            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Download
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Tabs */}
            <div className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="flex">
                    <button
                        onClick={() => setActiveTab('document')}
                        className={`flex-1 py-3 text-center font-medium transition-colors ${activeTab === 'document'
                            ? 'text-primary-600 border-b-2 border-primary-600'
                            : 'text-gray-500 dark:text-gray-400'
                            }`}
                    >
                        <FileText className="w-5 h-5 inline-block mr-2" />
                        Document
                    </button>
                    <button
                        onClick={() => setActiveTab('comments')}
                        className={`flex-1 py-3 text-center font-medium transition-colors ${activeTab === 'comments'
                            ? 'text-primary-600 border-b-2 border-primary-600'
                            : 'text-gray-500 dark:text-gray-400'
                            }`}
                    >
                        <MessageSquare className="w-5 h-5 inline-block mr-2" />
                        Comments ({comments.length})
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-screen-2xl mx-auto">
                <div className="lg:grid lg:grid-cols-[1fr,400px] lg:gap-6 p-4">
                    {/* PDF Viewer Section */}
                    <div className={`${activeTab === 'document' ? 'block' : 'hidden'} lg:block`}>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                            {isPDF ? (
                                <iframe
                                    src={upload.url}
                                    className="w-full h-[calc(100vh-200px)] lg:h-[calc(100vh-150px)]"
                                    title={upload.title}
                                />
                            ) : (
                                <div className="p-8 text-center">
                                    <img
                                        src={upload.url}
                                        alt={upload.title}
                                        className="max-w-full mx-auto"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Comments Section */}
                    <div className={`${activeTab === 'comments' ? 'block' : 'hidden'} lg:block`}>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 sticky top-[120px] h-[calc(100vh-200px)] lg:h-[calc(100vh-150px)] flex flex-col">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <MessageSquare className="w-5 h-5" />
                                Comments ({comments.length})
                            </h2>

                            {/* Comments List */}
                            <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                                {loadingComments ? (
                                    <div className="text-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                                    </div>
                                ) : comments.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                        <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        <p>No comments yet</p>
                                        <p className="text-sm">Be the first to comment!</p>
                                    </div>
                                ) : (
                                    comments.map(comment => (
                                        <div key={comment.id} className="border-b border-gray-200 dark:border-gray-700 pb-3">
                                            <div className="flex items-start justify-between mb-1">
                                                <span className="font-medium text-sm">
                                                    {comment.user_name}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {new Date(comment.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                                {comment.content}
                                            </p>
                                            {user?.id === comment.user_id && (
                                                <button
                                                    onClick={() => handleDeleteComment(comment.id)}
                                                    className="text-xs text-red-600 hover:text-red-700 mt-1"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Comment Input */}
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                <textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Add a comment..."
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                                    rows={3}
                                />
                                <button
                                    onClick={handlePostComment}
                                    disabled={!newComment.trim() || postingComment}
                                    className="mt-2 w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {postingComment ? 'Posting...' : 'Post Comment'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
