import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Shuffle } from 'lucide-react';
import { flashcardsApi } from '../services/api';

interface Flashcard {
    id: number;
    question: string;
    answer: string;
    card_order: number;
}

interface FlashcardSet {
    id: number;
    title: string;
    card_count: number;
    created_at: string;
}

export default function FlashcardStudy() {
    const { setId } = useParams<{ setId: string }>();
    const navigate = useNavigate();

    const [set, setSet] = useState<FlashcardSet | null>(null);
    const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!setId) return;

        setLoading(true);
        flashcardsApi.getSet(parseInt(setId))
            .then(res => {
                setSet(res.data.set);
                setFlashcards(res.data.flashcards);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch flashcards:', err);
                setLoading(false);
            });
    }, [setId]);

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
    };

    const handleNext = () => {
        if (currentIndex < flashcards.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setIsFlipped(false);
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            setIsFlipped(false);
        }
    };

    const handleShuffle = () => {
        const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
        setFlashcards(shuffled);
        setCurrentIndex(0);
        setIsFlipped(false);
    };

    const handleRestart = () => {
        setCurrentIndex(0);
        setIsFlipped(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading flashcards...</p>
                </div>
            </div>
        );
    }

    if (!set || flashcards.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 dark:text-gray-400">No flashcards found</p>
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

    const currentCard = flashcards[currentIndex];

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                                Study Mode
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {set.title}
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Flashcard Area */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Progress */}
                <div className="mb-6 text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Card {currentIndex + 1} / {flashcards.length}
                    </p>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                            className="bg-gradient-to-r from-primary-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Flashcard */}
                <div
                    onClick={handleFlip}
                    className="perspective-1000 cursor-pointer mb-8"
                >
                    <div
                        className={`relative w-full h-96 transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''
                            }`}
                        style={{
                            transformStyle: 'preserve-3d',
                            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                        }}
                    >
                        {/* Front */}
                        <div
                            className="absolute w-full h-full backface-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 flex flex-col items-center justify-center"
                            style={{ backfaceVisibility: 'hidden' }}
                        >
                            <p className="text-sm font-semibold text-primary-600 dark:text-primary-400 mb-4">
                                QUESTION
                            </p>
                            <p className="text-xl sm:text-2xl text-center text-gray-900 dark:text-white font-medium">
                                {currentCard.question}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-6">
                                Click to reveal answer
                            </p>
                        </div>

                        {/* Back */}
                        <div
                            className="absolute w-full h-full backface-hidden bg-gradient-to-br from-primary-600 to-purple-600 rounded-2xl shadow-2xl p-8 flex flex-col items-center justify-center"
                            style={{
                                backfaceVisibility: 'hidden',
                                transform: 'rotateY(180deg)',
                            }}
                        >
                            <p className="text-sm font-semibold text-white/90 mb-4">
                                ANSWER
                            </p>
                            <p className="text-xl sm:text-2xl text-center text-white font-medium">
                                {currentCard.answer}
                            </p>
                            <p className="text-sm text-white/70 mt-6">
                                Click to flip back
                            </p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mb-6">
                    <button
                        onClick={handlePrevious}
                        disabled={currentIndex === 0}
                        className="px-6 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium w-full sm:w-auto"
                    >
                        ← Previous
                    </button>
                    <button
                        onClick={handleNext}
                        disabled={currentIndex === flashcards.length - 1}
                        className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium w-full sm:w-auto"
                    >
                        Next →
                    </button>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3 justify-center">
                    <button
                        onClick={handleRestart}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Restart
                    </button>
                    <button
                        onClick={handleShuffle}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                    >
                        <Shuffle className="w-4 h-4" />
                        Shuffle
                    </button>
                </div>
            </div>
        </div>
    );
}
