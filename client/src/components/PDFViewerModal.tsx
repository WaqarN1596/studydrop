import { useEffect, useRef, useState, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
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
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [scale, setScale] = useState(1.5);
    const [rotation, setRotation] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditingPage, setIsEditingPage] = useState(false);
    const [pageInput, setPageInput] = useState('1');
    const [visiblePages, setVisiblePages] = useState<Set<number>>(new Set());
    const pageRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
    const canvasRefs = useRef<{ [key: number]: HTMLCanvasElement | null }>({});
    const renderingPages = useRef<Set<number>>(new Set());

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

    // Track current page and visible pages based on scroll position
    useEffect(() => {
        if (!containerRef.current || totalPages === 0) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const newVisiblePages = new Set(visiblePages);

                entries.forEach((entry) => {
                    const pageNum = parseInt(entry.target.getAttribute('data-page') || '1');

                    if (entry.isIntersecting) {
                        newVisiblePages.add(pageNum);
                        // Also add adjacent pages for smoother scrolling
                        if (pageNum > 1) newVisiblePages.add(pageNum - 1);
                        if (pageNum < totalPages) newVisiblePages.add(pageNum + 1);

                        // Update current page if this page is more than 50% visible
                        if (entry.intersectionRatio > 0.5) {
                            setCurrentPage(pageNum);
                            if (!isEditingPage) {
                                setPageInput(pageNum.toString());
                            }
                        }
                    } else {
                        newVisiblePages.delete(pageNum);
                    }
                });

                setVisiblePages(newVisiblePages);
            },
            {
                root: containerRef.current,
                threshold: [0, 0.5, 1],
                rootMargin: '200px', // Start loading pages 200px before they're visible
            }
        );

        Object.values(pageRefs.current).forEach((ref) => {
            if (ref) observer.observe(ref);
        });

        return () => observer.disconnect();
    }, [totalPages, isEditingPage, visiblePages]);

    // Render visible pages when they change
    useEffect(() => {
        if (!pdf) return;

        visiblePages.forEach((pageNum) => {
            if (!renderingPages.current.has(pageNum)) {
                renderPage(pageNum);
            }
        });
    }, [visiblePages, pdf, scale, rotation]);

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

    const renderPage = useCallback(async (pageNum: number) => {
        if (!pdf || renderingPages.current.has(pageNum)) return;

        const canvas = canvasRefs.current[pageNum];
        if (!canvas) return;

        renderingPages.current.add(pageNum);

        try {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale, rotation });
            const context = canvas.getContext('2d');

            if (!context) {
                renderingPages.current.delete(pageNum);
                return;
            }

            // Clear previous render
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const renderContext = {
                canvasContext: context,
                viewport: viewport,
            };

            await page.render(renderContext).promise;
        } catch (err) {
            console.error(`Error rendering page ${pageNum}:`, err);
        } finally {
            renderingPages.current.delete(pageNum);
        }
    }, [pdf, scale, rotation]);

    const handleZoomIn = () => {
        setScale((prev) => Math.min(prev + 0.25, 3));
    };

    const handleZoomOut = () => {
        setScale((prev) => Math.max(prev - 0.25, 0.5));
    };

    const handleRotate = () => {
        setRotation((prev) => (prev + 90) % 360);
    };

    const handlePageJump = (e?: React.FormEvent) => {
        e?.preventDefault();
        const pageNum = parseInt(pageInput);
        if (pageNum >= 1 && pageNum <= totalPages) {
            const pageDiv = pageRefs.current[pageNum];
            if (pageDiv) {
                pageDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
        setIsEditingPage(false);
    };

    const handlePageInputClick = () => {
        setIsEditingPage(true);
        setPageInput(currentPage.toString());
    };

    const handlePageInputBlur = () => {
        setIsEditingPage(false);
        setPageInput(currentPage.toString());
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-2 sm:p-4"
            onClick={handleBackdropClick}
        >
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] sm:max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-base sm:text-lg font-semibold truncate flex-1 mr-4">{filename}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    {/* Zoom Controls */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleZoomOut}
                            disabled={scale <= 0.5}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Zoom out"
                        >
                            <ZoomOut className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <span className="text-xs sm:text-sm font-medium min-w-[3.5rem] text-center">
                            {Math.round(scale * 100)}%
                        </span>
                        <button
                            onClick={handleZoomIn}
                            disabled={scale >= 3}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Zoom in"
                        >
                            <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <button
                            onClick={handleRotate}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors ml-2"
                            aria-label="Rotate"
                        >
                            <RotateCw className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    </div>

                    {/* Page Navigation */}
                    <form onSubmit={handlePageJump} className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-medium hidden sm:inline">Page:</span>
                        {isEditingPage ? (
                            <input
                                type="number"
                                min="1"
                                max={totalPages}
                                value={pageInput}
                                onChange={(e) => setPageInput(e.target.value)}
                                onBlur={handlePageInputBlur}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handlePageJump(e);
                                    } else if (e.key === 'Escape') {
                                        setIsEditingPage(false);
                                        setPageInput(currentPage.toString());
                                    }
                                }}
                                autoFocus
                                className="w-16 sm:w-20 px-2 py-1 text-xs sm:text-sm text-center border border-primary-500 rounded bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        ) : (
                            <button
                                type="button"
                                onClick={handlePageInputClick}
                                className="w-16 sm:w-20 px-2 py-1 text-xs sm:text-sm font-medium text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 hover:border-primary-500 transition-colors"
                            >
                                {currentPage}
                            </button>
                        )}
                        <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            / {totalPages}
                        </span>
                    </form>
                </div>

                {/* PDF Container - Continuous Scroll with Lazy Loading */}
                <div
                    ref={containerRef}
                    className="flex-1 overflow-auto p-2 sm:p-4 bg-gray-100 dark:bg-gray-900"
                >
                    {loading && (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                        </div>
                    )}
                    {error && (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-red-600 dark:text-red-400 text-sm sm:text-base px-4 text-center">{error}</div>
                        </div>
                    )}
                    {!loading && !error && (
                        <div className="flex flex-col items-center gap-3 sm:gap-4">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                                <div
                                    key={pageNum}
                                    ref={(el) => (pageRefs.current[pageNum] = el)}
                                    data-page={pageNum}
                                    className="relative"
                                >
                                    <div className="absolute -top-6 sm:-top-8 left-0 text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
                                        Page {pageNum}
                                    </div>
                                    <canvas
                                        ref={(el) => (canvasRefs.current[pageNum] = el)}
                                        className="shadow-lg bg-white max-w-full h-auto"
                                        style={{ minHeight: '400px' }} // Prevent layout shift
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
