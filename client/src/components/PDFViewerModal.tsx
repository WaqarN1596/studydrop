import { useEffect, useRef, useState } from 'react';
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PDFViewerModalProps {
    url: string;
    filename: string;
    onClose: () => void;
}

export default function PDFViewerModal({ url, filename, onClose }: PDFViewerModalProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [pdf, setPdf] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [scale, setScale] = useState(1.5);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        // Prevent background scrolling
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    useEffect(() => {
        loadPDF();
    }, [url]);

    useEffect(() => {
        if (pdf) {
            renderPage(currentPage);
        }
    }, [pdf, currentPage, scale]);

    const loadPDF = async () => {
        try {
            setLoading(true);
            setError('');

            const token = localStorage.getItem('token');

            // Fetch the PDF data directly to avoid PDF.js worker CORS/Header issues
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
            }

            const arrayBuffer = await response.arrayBuffer();

            const loadingTask = pdfjsLib.getDocument({
                data: arrayBuffer,
            });

            const pdfDoc = await loadingTask.promise;
            setPdf(pdfDoc);
            setTotalPages(pdfDoc.numPages);
            setLoading(false);
        } catch (err: any) {
            console.error('Error loading PDF:', err);
            setError(`Failed to load PDF: ${err.message || 'Unknown error'}`);
            setLoading(false);
        }
    };

    const renderPage = async (pageNum: number) => {
        if (!pdf || !canvasRef.current) return;

        try {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale });
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            if (!context) return;

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const renderContext = {
                canvasContext: context,
                viewport: viewport,
            };

            await page.render(renderContext).promise;
        } catch (err) {
            console.error('Error rendering page:', err);
        }
    };

    const handleZoomIn = () => {
        setScale((prev) => Math.min(prev + 0.25, 3));
    };

    const handleZoomOut = () => {
        setScale((prev) => Math.max(prev - 0.25, 0.5));
    };

    const handlePrevPage = () => {
        setCurrentPage((prev) => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
            onClick={handleBackdropClick}
        >
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold truncate flex-1 mr-4">{filename}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    {/* Zoom Controls */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleZoomOut}
                            disabled={scale <= 0.5}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Zoom out"
                        >
                            <ZoomOut className="w-5 h-5" />
                        </button>
                        <span className="text-sm font-medium min-w-[4rem] text-center">
                            {Math.round(scale * 100)}%
                        </span>
                        <button
                            onClick={handleZoomIn}
                            disabled={scale >= 3}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Zoom in"
                        >
                            <ZoomIn className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Page Navigation */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrevPage}
                            disabled={currentPage <= 1}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Previous page"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="text-sm font-medium min-w-[5rem] text-center">
                            {currentPage} / {totalPages}
                        </span>
                        <button
                            onClick={handleNextPage}
                            disabled={currentPage >= totalPages}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Next page"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* PDF Canvas */}
                <div className="flex-1 overflow-auto p-4 bg-gray-100 dark:bg-gray-900">
                    {loading && (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                        </div>
                    )}
                    {error && (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-red-600 dark:text-red-400">{error}</div>
                        </div>
                    )}
                    {!loading && !error && (
                        <div className="flex justify-center">
                            <canvas
                                ref={canvasRef}
                                className="shadow-lg bg-white"
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
