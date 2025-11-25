import { useEffect, useRef, useState } from 'react';
import { X, ZoomIn, ZoomOut } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker - using unpkg for better reliability
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface PDFViewerModalProps {
    url: string;
    filename: string;
    onClose: () => void;
}

export default function PDFViewerModal({ url, filename, onClose }: PDFViewerModalProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [pdf, setPdf] = useState<any>(null);
    const [totalPages, setTotalPages] = useState(0);
    const [scale, setScale] = useState(1.5);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [pageInput, setPageInput] = useState('');
    const pageRefs = useRef<{ [key: number]: HTMLCanvasElement | null }>({});

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
        if (pdf && totalPages > 0) {
            // Render all pages when PDF loads or scale changes
            renderAllPages();
        }
    }, [pdf, scale]);

    const loadPDF = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await fetch(url);

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

    const renderAllPages = async () => {
        if (!pdf) return;

        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
            await renderPage(pageNum);
        }
    };

    const renderPage = async (pageNum: number) => {
        if (!pdf) return;

        const canvas = pageRefs.current[pageNum];
        if (!canvas) return;

        try {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale });
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
            console.error(`Error rendering page ${pageNum}:`, err);
        }
    };

    const handleZoomIn = () => {
        setScale((prev) => Math.min(prev + 0.25, 3));
    };

    const handleZoomOut = () => {
        setScale((prev) => Math.max(prev - 0.25, 0.5));
    };

    const handlePageJump = (e: React.FormEvent) => {
        e.preventDefault();
        const pageNum = parseInt(pageInput);
        if (pageNum >= 1 && pageNum <= totalPages) {
            const canvas = pageRefs.current[pageNum];
            if (canvas) {
                canvas.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
        setPageInput('');
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

                    {/* Page Jump */}
                    <form onSubmit={handlePageJump} className="flex items-center gap-2">
                        <span className="text-sm font-medium">Page:</span>
                        <input
                            type="number"
                            min="1"
                            max={totalPages}
                            value={pageInput}
                            onChange={(e) => setPageInput(e.target.value)}
                            placeholder={`1-${totalPages}`}
                            className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <button
                            type="submit"
                            className="px-3 py-1 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded transition-colors"
                        >
                            Go
                        </button>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            / {totalPages}
                        </span>
                    </form>
                </div>

                {/* PDF Container - Continuous Scroll */}
                <div
                    ref={containerRef}
                    className="flex-1 overflow-auto p-4 bg-gray-100 dark:bg-gray-900"
                >
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
                        <div className="flex flex-col items-center gap-4">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                                <div key={pageNum} className="relative">
                                    <div className="absolute -top-8 left-0 text-sm text-gray-600 dark:text-gray-400">
                                        Page {pageNum}
                                    </div>
                                    <canvas
                                        ref={(el) => (pageRefs.current[pageNum] = el)}
                                        className="shadow-lg bg-white"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
