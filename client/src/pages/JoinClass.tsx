import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collegeApi, classApi } from '../services/api';
import { College, Class } from '../types';
import { BookOpen, Search, Plus } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function JoinClass() {
    const navigate = useNavigate();
    const [colleges, setColleges] = useState<College[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [selectedCollege, setSelectedCollege] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState<number | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        collegeApi.getColleges().then((res) => {
            setColleges(res.data.colleges);
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        if (selectedCollege) {
            classApi.getClasses(selectedCollege).then((res) => {
                setClasses(res.data.classes);
            });
        } else {
            classApi.getClasses().then((res) => {
                setClasses(res.data.classes);
            });
        }
    }, [selectedCollege]);

    const handleJoinClass = async (classId: number) => {
        setJoining(classId);
        setError('');
        setSuccess('');

        try {
            await classApi.joinClass({ classId, semester: 'Fall 2024' });
            setSuccess('Successfully joined class!');
            setTimeout(() => {
                navigate('/dashboard');
            }, 1500);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to join class');
        } finally {
            setJoining(null);
        }
    };

    const filteredClasses = classes.filter((cls) =>
        cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cls.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Join a Class</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Browse and join classes to access shared materials
                    </p>
                </div>

                {error && (
                    <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg mb-4">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-green-100 dark:bg-green-900 border border-green-400 text-green-700 dark:text-green-200 px-4 py-3 rounded-lg mb-4">
                        {success}
                    </div>
                )}

                {/* Filters */}
                <div className="grid md:grid-cols-2 gap-4 mb-8">
                    <div>
                        <label className="block text-sm font-medium mb-2">Filter by College</label>
                        <select
                            value={selectedCollege || ''}
                            onChange={(e) => setSelectedCollege(e.target.value ? parseInt(e.target.value) : null)}
                            className="input"
                        >
                            <option value="">All Colleges</option>
                            {colleges.map((college) => (
                                <option key={college.id} value={college.id}>
                                    {college.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Search Classes</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name or code..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="input pl-10"
                            />
                        </div>
                    </div>
                </div>

                {/* Classes Grid */}
                {filteredClasses.length === 0 ? (
                    <div className="card text-center py-12">
                        <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">No classes found</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredClasses.map((cls) => (
                            <div key={cls.id} className="card-hover">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 bg-primary-100 dark:bg-primary-900 rounded-lg">
                                        <BookOpen className="w-6 h-6 text-primary-600" />
                                    </div>
                                    <span className="text-xs font-semibold text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                        {cls.code}
                                    </span>
                                </div>

                                <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                                    {cls.name}
                                </h3>

                                {cls.description && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                                        {cls.description}
                                    </p>
                                )}

                                <button
                                    onClick={() => handleJoinClass(cls.id)}
                                    disabled={joining === cls.id}
                                    className="btn-primary w-full flex items-center justify-center gap-2"
                                >
                                    {joining === cls.id ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Joining...
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="w-4 h-4" />
                                            Join Class
                                        </>
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
