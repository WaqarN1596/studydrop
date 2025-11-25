import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collegeApi, classApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { College, Class } from '../types';
import { BookOpen, Search, Plus, Loader2 } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function JoinClass() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [colleges, setColleges] = useState<College[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [selectedCollege, setSelectedCollege] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState<number | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Create Class State
    const [isCreatingClass, setIsCreatingClass] = useState(false);
    const [newClassData, setNewClassData] = useState({ name: '', code: '', description: '' });
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        collegeApi.getColleges().then((res) => {
            setColleges(res.data.colleges);
            setLoading(false);
        });

        if (user?.college_id) {
            setSelectedCollege(user.college_id);
        }
    }, [user]);

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

    const handleCreateClass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCollege) {
            setError('Please select a college first');
            return;
        }

        setError('');
        setCreating(true);

        try {
            const res = await classApi.createClass({
                ...newClassData,
                collegeId: selectedCollege
            });

            // Add to list and select/join it automatically (backend auto-joins)
            setClasses([...classes, res.data.class]);
            setSuccess('Class created and joined successfully!');
            setIsCreatingClass(false);
            setNewClassData({ name: '', code: '', description: '' });

            setTimeout(() => {
                navigate('/dashboard');
            }, 1500);
        } catch (err: any) {
            console.error('Failed to create class', err);
            setError(err.response?.data?.error || 'Failed to create class');
        } finally {
            setCreating(false);
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
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Join a Class</h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Browse and join classes to access shared materials
                        </p>
                    </div>
                    <button
                        onClick={() => setIsCreatingClass(!isCreatingClass)}
                        className="btn-secondary flex items-center gap-2"
                    >
                        <Plus size={18} />
                        {isCreatingClass ? 'Cancel Creation' : 'Create New Class'}
                    </button>
                </div>

                {error && (
                    <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg mb-4 animate-shake">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-green-100 dark:bg-green-900 border border-green-400 text-green-700 dark:text-green-200 px-4 py-3 rounded-lg mb-4 animate-fade-in">
                        {success}
                    </div>
                )}

                {/* Create Class Form */}
                {isCreatingClass && (
                    <div className="card mb-8 border-2 border-primary-100 dark:border-primary-900 animate-slide-down">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600">
                                <Plus size={16} />
                            </div>
                            Add New Class
                        </h3>
                        <form onSubmit={handleCreateClass}>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Class Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Computing I"
                                        className="input w-full"
                                        value={newClassData.name}
                                        onChange={e => setNewClassData({ ...newClassData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Course Code</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. COMP.1010"
                                        className="input w-full"
                                        value={newClassData.code}
                                        onChange={e => setNewClassData({ ...newClassData, code: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</label>
                                    <input
                                        type="text"
                                        placeholder="Optional description"
                                        className="input w-full"
                                        value={newClassData.description}
                                        onChange={e => setNewClassData({ ...newClassData, description: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCreatingClass(false)}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" disabled={creating}>
                                    {creating ? <Loader2 className="animate-spin" /> : 'Create Class'}
                                </button>
                            </div>
                        </form>
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
                        {!isCreatingClass && (
                            <button
                                onClick={() => setIsCreatingClass(true)}
                                className="mt-4 text-primary-600 hover:underline font-medium"
                            >
                                Create a new class instead
                            </button>
                        )}
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
