import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, MessageSquare, ZoomIn, ZoomOut, RotateCw, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
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
    const { user } = useAuthStore();

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

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Document Viewer */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg mb-8 overflow-hidden">
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

                {/* Main Content */}
                <div className="flex-1 flex overflow-hidden relative">
                    {/* Document Viewer Area */}
                    <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isChatOpen ? 'mr-0' : ''}`}>
                        <div className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-900 p-4 sm:p-6 flex justify-center">
                            <div className={`w-full bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden transition-all duration-300 ${isChatOpen ? 'max-w-3xl' : 'max-w-5xl'
                                }`}>
                                {isPDF ? (
                                    <div className="w-full overflow-auto flex justify-center bg-gray-50 dark:bg-gray-900/50 p-4" style={{ minHeight: '800px' }}>
                                        <canvas ref={canvasRef} className="shadow-lg max-w-full" />
                                    </div>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900/50 p-4">
                                        <img
                                            src={upload?.url}
                                            alt={upload?.title}
                                            className="max-w-full max-h-[80vh] object-contain shadow-lg rounded-lg"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Chat Panel - Slide in from right */}
                    <div className={`fixed inset-y-0 right-0 w-full sm:w-[400px] transform transition-transform duration-300 ease-in-out z-30 ${isChatOpen ? 'translate-x-0' : 'translate-x-full'
                        } sm:relative sm:transform-none sm:w-[400px] sm:border-l border-gray-200 dark:border-gray-700 ${isChatOpen ? 'sm:block' : 'sm:hidden'
                        }`}>
                        {isChatOpen && upload && (
                            <ChatPanel
                                uploadId={parseInt(id!)}
                                onClose={() => setIsChatOpen(false)}
                            />
                        )}
                    </div>
                                        )}
                </div>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {comment.content}
                </p>
            </div>
            ))
                        )}
        </div>
                </div >
            </div >
        </div >
    );
}
