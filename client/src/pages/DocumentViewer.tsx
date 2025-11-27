import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, ZoomIn, ZoomOut, RotateCw, ChevronLeft, ChevronRight, Sparkles, Loader2, Send } from 'lucide-react';
import { uploadsApi, commentsApi } from '../services/api';
import ChatPanel from '../components/ChatPanel';
import { useAuthStore } from '../store/authStore';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface Upload {
    id: number;
    title: string;
    original_filename: string;
    url: string;
    mimeType: string;
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
    const { user: currentUser } = useAuthStore();

    const [upload, setUpload] = useState<Upload | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadingComments, setLoadingComments] = useState(true);
    const [postingComment, setPostingComment] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);

    // PDF viewer state
    const containerRef = useRef<HTMLDivElement>(null);
    const [pdf, setPdf] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [scale, setScale] = useState(1.5);
    const [rotation, setRotation] = useState(0);
    const [pdfLoading, setPdfLoading] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Fetch upload details
    useEffect(() => {
        if (!id) return;

        setLoading(true);
        uploadsApi.getUploadById(parseInt(id))
            .then(res => {
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

    // Load PDF
    useEffect(() => {
        if (!upload?.url || !upload.mimeType?.includes('pdf')) return;

        setPdfLoading(true);
        pdfjsLib.getDocument(upload.url).promise
            .then(loadedPdf => {
                setPdf(loadedPdf);
                setTotalPages(loadedPdf.numPages);
                setPdfLoading(false);
            })
            .catch(err => {
                console.error('Error loading PDF:', err);
                setPdfLoading(false);
            });
    }, [upload]);

    // Render current page
    const renderPage = useCallback(async (pageNum: number) => {
        if (!pdf || !canvasRef.current) return;

        const page = await pdf.getPage(pageNum);
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        const viewport = page.getViewport({ scale, rotation });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
            canvasContext: context,
            viewport: viewport,
        }).promise;
    }, [pdf, scale, rotation]);

    useEffect(() => {
        if (pdf && currentPage) {
            renderPage(currentPage);
        }
    }, [pdf, currentPage, scale, rotation, renderPage]);

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

        // Create temporary anchor to trigger download
        const link = document.createElement('a');
        link.href = upload.url;
        link.download = upload.title || upload.original_filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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

    const isPDF = upload.mimeType?.includes('pdf');

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                            <button
                                onClick={() => navigate(-1)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="min-w-0 flex-1">
                                <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white truncate">
                                    {upload.title || upload.original_filename}
                                </h1>
                                {upload.class_name && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                        {upload.class_name}
                                    </p>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={() => setIsChatOpen(!isChatOpen)}
                            className={`ml-4 flex items-center gap-2 px-4 py-2 rounded-lg transition-colors flex-shrink-0 text-sm sm:text-base ${isChatOpen
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                                : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                                }`}
                        >
                            <Sparkles className="w-4 h-4" />
                            <span className="hidden sm:inline">Chat with AI</span>
                        </button>
                        <button
                            onClick={handleDownload}
                            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex-shrink-0 text-sm sm:text-base"
                        >
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">Download</span>
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden relative h-[calc(100vh-64px)]">
                {/* Main Content Area (Viewer + Comments) */}
                <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isChatOpen ? 'mr-0' : ''} overflow-y-auto`}>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
                        {/* Document Viewer */}
                        <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg mb-8 overflow-hidden transition-all duration-300 mx-auto ${isChatOpen ? 'max-w-3xl' : 'max-w-5xl'}`}>
                            {isPDF ? (
                                <>
                                    {/* PDF Controls */}
                                    <div className="bg-gray-100 dark:bg-gray-700 px-4 py-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-600">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                                disabled={currentPage <= 1}
                                                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <ChevronLeft className="w-5 h-5" />
                                            </button>
                                            <span className="text-sm font-medium px-3">
                                                Page {currentPage} / {totalPages}
                                            </span>
                                            <button
                                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                                disabled={currentPage >= totalPages}
                                                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setScale(Math.max(0.5, scale - 0.25))}
                                                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                                title="Zoom Out"
                                            >
                                                <ZoomOut className="w-5 h-5" />
                                            </button>
                                            <span className="text-sm font-medium px-2">{Math.round(scale * 100)}%</span>
                                            <button
                                                onClick={() => setScale(Math.min(3, scale + 0.25))}
                                                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                                title="Zoom In"
                                            >
                                                <ZoomIn className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => setRotation((rotation + 90) % 360)}
                                                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                                title="Rotate"
                                            >
                                                <RotateCw className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* PDF Canvas */}
                                    <div
                                        ref={containerRef}
                                        className="overflow-auto bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-8"
                                        style={{ maxHeight: '70vh' }}
                                    >
                                        {pdfLoading ? (
                                            <div className="text-center py-16">
                                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                                                <p className="text-gray-600 dark:text-gray-400">Loading PDF...</p>
                                            </div>
                                        ) : (
                                            <canvas
                                                ref={canvasRef}
                                                className="shadow-2xl"
                                            />
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="p-8 text-center bg-gray-50 dark:bg-gray-900">
                                    <img
                                        src={upload.url}
                                        alt={upload.title}
                                        className="max-w-full max-h-[70vh] mx-auto rounded-lg shadow-lg"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Comments Section */}
                        <div className={`mx-auto ${isChatOpen ? 'max-w-3xl' : 'max-w-5xl'}`}>
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Comments</h2>
                                {/* Input */}
                                <div className="mb-8">
                                    <textarea
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Add a comment..."
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none transition-shadow"
                                        rows={3}
                                    />
                                    <div className="mt-2 flex justify-end">
                                        <button
                                            onClick={handlePostComment}
                                            disabled={postingComment || !newComment.trim()}
                                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {postingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                            Post Comment
                                        </button>
                                    </div>
                                </div>

                                {/* List */}
                                <div className="space-y-6">
                                    {loadingComments ? (
                                        <div className="text-center py-8">
                                            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary-600" />
                                        </div>
                                    ) : comments.length === 0 ? (
                                        <p className="text-center text-gray-500 dark:text-gray-400 py-8">No comments yet. Be the first to share your thoughts!</p>
                                    ) : (
                                        comments.map((comment) => (
                                            <div key={comment.id} className="flex gap-4 group">
                                                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                                                    <span className="font-semibold text-primary-700 dark:text-primary-300">
                                                        {comment.user_name?.[0]?.toUpperCase() || 'U'}
                                                    </span>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="font-medium text-gray-900 dark:text-white">
                                                                {comment.user_name || 'User'}
                                                            </span>
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                {new Date(comment.created_at).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{comment.content}</p>
                                                    </div>
                                                    {currentUser?.id === comment.user_id && (
                                                        <button
                                                            onClick={() => handleDeleteComment(comment.id)}
                                                            className="mt-1 text-xs text-red-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            Delete
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chat Panel - Slide in from right */}
                <div className={`fixed inset-y-0 right-0 w-full sm:w-[400px] transform transition-transform duration-300 ease-in-out z-30 ${isChatOpen ? 'translate-x-0' : 'translate-x-full'
                    } sm:relative sm:transform-none sm:top-auto sm:right-auto sm:bottom-auto sm:left-auto sm:w-[400px] sm:border-l border-gray-200 dark:border-gray-700 ${isChatOpen ? 'sm:block' : 'sm:hidden'
                    }`}>
                    {isChatOpen && upload && (
                        <ChatPanel
                            uploadId={parseInt(id!)}
                            onClose={() => setIsChatOpen(false)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
