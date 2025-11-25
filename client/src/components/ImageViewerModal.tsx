import { useEffect, useState } from 'react';
import { X, ZoomIn, ZoomOut } from 'lucide-react';

interface ImageViewerModalProps {
    url: string;
    filename: string;
    onClose: () => void;
}

export default function ImageViewerModal({ url, filename, onClose }: ImageViewerModalProps) {
    const [scale, setScale] = useState(1);

    useEffect(() => {
        // Prevent background scrolling
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const handleZoomIn = () => {
        setScale((prev) => Math.min(prev + 0.25, 3));
    };

    const handleZoomOut = () => {
        setScale((prev) => Math.max(prev - 0.25, 0.5));
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
                <div className="flex items-center justify-center gap-2 p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
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

                {/* Image */}
                <div className="flex-1 overflow-auto p-4 bg-gray-100 dark:bg-gray-900">
                    <div className="flex justify-center items-center min-h-full">
                        <img
                            src={url}
                            alt={filename}
                            style={{
                                transform: `scale(${scale})`,
                                transition: 'transform 0.2s ease',
                            }}
                            className="max-w-full h-auto object-contain"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
