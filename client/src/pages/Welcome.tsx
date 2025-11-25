import { Link } from 'react-router-dom';
import { Upload, Search, Tag, Shield, Zap, Users } from 'lucide-react';

export default function Welcome() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            {/* Hero Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
                <div className="text-center animate-fade-in">
                    <div className="flex justify-center mb-8">
                        <div className="p-4 bg-primary-600 rounded-2xl shadow-2xl">
                            <Upload className="w-16 h-16 text-white" />
                        </div>
                    </div>

                    <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                        Welcome to <span className="text-primary-600">StudyDrop</span>
                    </h1>

                    <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto">
                        The intelligent platform for college students to upload, share, and discover class materials.
                        Powered by AI for smart tagging, semantic search, and recommendations.
                    </p>

                    <div className="flex justify-center gap-4 flex-wrap">
                        <Link
                            to="/register"
                            className="btn-primary text-lg px-8 py-3 shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                            Get Started
                        </Link>
                        <Link
                            to="/login"
                            className="btn-secondary text-lg px-8 py-3 shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                            Sign In
                        </Link>
                    </div>
                </div>

                {/* Features */}
                <div className="mt-24 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div className="card-hover animate-slide-up">
                        <div className="p-3 bg-primary-100 dark:bg-primary-900 rounded-lg w-fit mb-4">
                            <Tag className="w-6 h-6 text-primary-600" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">AI-Powered Tagging</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Automatic categorization and tagging of your uploads using advanced AI
                        </p>
                    </div>

                    <div className="card-hover animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        <div className="p-3 bg-primary-100 dark:bg-primary-900 rounded-lg w-fit mb-4">
                            <Search className="w-6 h-6 text-primary-600" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Semantic Search</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Find exactly what you need with intelligent, context-aware search
                        </p>
                    </div>

                    <div className="card-hover animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        <div className="p-3 bg-primary-100 dark:bg-primary-900 rounded-lg w-fit mb-4">
                            <Zap className="w-6 h-6 text-primary-600" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Smart Recommendations</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Discover related materials and study resources automatically
                        </p>
                    </div>

                    <div className="card-hover animate-slide-up" style={{ animationDelay: '0.3s' }}>
                        <div className="p-3 bg-primary-100 dark:bg-primary-900 rounded-lg w-fit mb-4">
                            <Shield className="w-6 h-6 text-primary-600" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Duplicate Detection</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Prevent duplicate uploads with AI-powered similarity detection
                        </p>
                    </div>

                    <div className="card-hover animate-slide-up" style={{ animationDelay: '0.4s' }}>
                        <div className="p-3 bg-primary-100 dark:bg-primary-900 rounded-lg w-fit mb-4">
                            <Users className="w-6 h-6 text-primary-600" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Class Communities</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Join your classes and collaborate with classmates
                        </p>
                    </div>

                    <div className="card-hover animate-slide-up" style={{ animationDelay: '0.5s' }}>
                        <div className="p-3 bg-primary-100 dark:bg-primary-900 rounded-lg w-fit mb-4">
                            <Upload className="w-6 h-6 text-primary-600" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Easy Uploads</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Drag & drop interface with support for PDFs and images
                        </p>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                <p>&copy; 2024 StudyDrop. Built for students, by students.</p>
            </div>
        </div>
    );
}
