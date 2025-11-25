import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { collegeApi, userApi, classApi } from '../services/api';
import { BookOpen, CheckCircle, GraduationCap, ArrowRight, Search, Plus, Loader2 } from 'lucide-react';

export default function Onboarding() {
    const { user, updateUser } = useAuthStore();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);

    // Step 1: Major Selection
    const [majors, setMajors] = useState<any[]>([]);
    const [selectedMajorId, setSelectedMajorId] = useState<number | ''>('');

    // Step 2: Class Selection
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClassIds, setSelectedClassIds] = useState<number[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreatingClass, setIsCreatingClass] = useState(false);
    const [newClassData, setNewClassData] = useState({ name: '', code: '', description: '' });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user?.college_id) {
            collegeApi.getMajors(user.college_id)
                .then(res => setMajors(res.data.majors))
                .catch(err => console.error('Failed to fetch majors', err));
        }
    }, [user?.college_id]);

    useEffect(() => {
        if (step === 2 && user?.college_id) {
            fetchClasses();
        }
    }, [step, user?.college_id, searchQuery]);

    const fetchClasses = () => {
        classApi.getClasses(user?.college_id)
            .then(res => {
                let filtered = res.data.classes;
                if (searchQuery) {
                    const query = searchQuery.toLowerCase();
                    filtered = filtered.filter((c: any) =>
                        c.name.toLowerCase().includes(query) ||
                        c.code.toLowerCase().includes(query)
                    );
                }
                setClasses(filtered);
            })
            .catch(err => console.error('Failed to fetch classes', err));
    };

    const handleMajorSubmit = async () => {
        if (!selectedMajorId || !user) return;
        setLoading(true);
        try {
            await userApi.updateUser(user.id, { major_id: selectedMajorId });
            const majorName = majors.find(m => m.id === selectedMajorId)?.name;
            updateUser({ ...user, major_id: Number(selectedMajorId), major: majorName });
            setStep(2);
        } catch (error) {
            console.error('Failed to update major', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleClassSelection = (classId: number) => {
        setSelectedClassIds(prev =>
            prev.includes(classId)
                ? prev.filter(id => id !== classId)
                : [...prev, classId]
        );
    };

    const handleCreateClass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.college_id) return;
        setLoading(true);
        try {
            const res = await classApi.createClass({
                ...newClassData,
                collegeId: user.college_id
            });
            setClasses([...classes, res.data.class]);
            setSelectedClassIds([...selectedClassIds, res.data.class.id]);
            setIsCreatingClass(false);
            setNewClassData({ name: '', code: '', description: '' });
        } catch (error) {
            console.error('Failed to create class', error);
            alert('Failed to create class. It might already exist.');
        } finally {
            setLoading(false);
        }
    };

    const handleClassesSubmit = async () => {
        setLoading(true);
        try {
            // Join all selected classes
            const promises = selectedClassIds.map(classId =>
                classApi.joinClass({ classId, semester: 'Fall 2024' })
            );
            await Promise.all(promises);
            setStep(3);
        } catch (error) {
            console.error('Failed to join classes', error);
            // Proceed anyway, maybe show a toast
            setStep(3);
        } finally {
            setLoading(false);
        }
    };

    const handleFinish = () => {
        navigate('/dashboard');
    };

    if (!user) {
        navigate('/login');
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center py-12 px-4 transition-colors duration-300">
            <div className="w-full max-w-4xl">
                {/* Progress Steps */}
                <div className="flex justify-between mb-12 relative max-w-2xl mx-auto">
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 dark:bg-gray-700 -z-10 transform -translate-y-1/2 rounded-full"></div>

                    {[
                        { icon: GraduationCap, label: 'Select Major', stepNum: 1 },
                        { icon: BookOpen, label: 'Join Classes', stepNum: 2 },
                        { icon: CheckCircle, label: 'All Set!', stepNum: 3 }
                    ].map(({ icon: Icon, label, stepNum }) => (
                        <div key={stepNum} className={`flex flex-col items-center transition-all duration-300 ${step >= stepNum ? 'text-primary-600 scale-105' : 'text-gray-400'}`}>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 shadow-lg transition-all duration-300 ${step >= stepNum ? 'bg-primary-600 text-white ring-4 ring-primary-100 dark:ring-primary-900/30' : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700'}`}>
                                <Icon size={24} />
                            </div>
                            <span className="text-sm font-bold tracking-wide">{label}</span>
                        </div>
                    ))}
                </div>

                {/* Step 1: Select Major */}
                {step === 1 && (
                    <div className="card animate-fade-in max-w-2xl mx-auto shadow-xl border-t-4 border-primary-500">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-400">What is your Major?</h2>
                            <p className="text-gray-500 dark:text-gray-400">Select your field of study to get personalized recommendations.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                            {majors.map((major) => (
                                <button
                                    key={major.id}
                                    onClick={() => setSelectedMajorId(major.id)}
                                    className={`p-5 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-md ${selectedMajorId === major.id
                                            ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 shadow-inner'
                                            : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                        }`}
                                >
                                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{major.name}</h3>
                                </button>
                            ))}
                        </div>
                        <div className="flex justify-end">
                            <button
                                onClick={handleMajorSubmit}
                                disabled={!selectedMajorId || loading}
                                className="btn-primary flex items-center gap-2 px-8 py-3 text-lg shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 transition-all transform hover:-translate-y-0.5"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : 'Next Step'} <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Join Classes */}
                {step === 2 && (
                    <div className="card animate-fade-in shadow-xl border-t-4 border-primary-500">
                        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                            <div>
                                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-400">Join Your Classes</h2>
                                <p className="text-gray-500 dark:text-gray-400 mt-1">Find and join your current semester classes.</p>
                            </div>
                            <button
                                onClick={() => setIsCreatingClass(!isCreatingClass)}
                                className="text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                            >
                                <Plus size={18} /> Can't find your class?
                            </button>
                        </div>

                        {isCreatingClass && (
                            <form onSubmit={handleCreateClass} className="mb-8 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 animate-slide-down">
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600">
                                        <Plus size={16} />
                                    </div>
                                    Add New Class
                                </h3>
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
                                    <button type="submit" className="btn-primary" disabled={loading}>
                                        {loading ? <Loader2 className="animate-spin" /> : 'Create Class'}
                                    </button>
                                </div>
                            </form>
                        )}

                        <div className="relative mb-6 group">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Search for classes by name or code..."
                                className="input pl-12 py-3 text-lg shadow-sm focus:shadow-md transition-shadow"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {classes.map((cls) => (
                                <button
                                    key={cls.id}
                                    onClick={() => toggleClassSelection(cls.id)}
                                    className={`p-5 rounded-xl border-2 text-left transition-all duration-200 group relative overflow-hidden ${selectedClassIds.includes(cls.id)
                                            ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 shadow-md'
                                            : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-300 hover:shadow-md'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">{cls.name}</h3>
                                        {selectedClassIds.includes(cls.id) && (
                                            <div className="bg-primary-100 dark:bg-primary-900/50 p-1 rounded-full">
                                                <CheckCircle size={16} className="text-primary-600" />
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-sm font-mono text-primary-600 dark:text-primary-400 mb-2 bg-primary-50 dark:bg-primary-900/20 inline-block px-2 py-0.5 rounded">{cls.code}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{cls.description}</p>
                                </button>
                            ))}
                            {classes.length === 0 && (
                                <div className="col-span-full text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                        <Search size={32} />
                                    </div>
                                    <p className="text-gray-500 font-medium">No classes found matching "{searchQuery}"</p>
                                    <button
                                        onClick={() => setIsCreatingClass(true)}
                                        className="mt-4 text-primary-600 hover:underline font-medium"
                                    >
                                        Create a new class instead
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between items-center border-t pt-6 dark:border-gray-700">
                            <div className="flex items-center gap-2">
                                <span className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm font-medium">
                                    {selectedClassIds.length} selected
                                </span>
                            </div>
                            <button
                                onClick={handleClassesSubmit}
                                className="btn-primary flex items-center gap-2 px-8 py-3 text-lg shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 transition-all transform hover:-translate-y-0.5"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : 'Continue'} <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Completion */}
                {step === 3 && (
                    <div className="card animate-fade-in text-center py-16 max-w-2xl mx-auto shadow-xl border-t-4 border-green-500">
                        <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce-slow">
                            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
                        </div>
                        <h2 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-teal-500">You're All Set!</h2>
                        <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-md mx-auto leading-relaxed">
                            Your profile is ready. Start discovering materials and acing your classes!
                        </p>
                        <button
                            onClick={handleFinish}
                            className="btn-primary text-lg px-10 py-4 shadow-xl shadow-primary-500/30 hover:shadow-primary-500/50 transition-all transform hover:-translate-y-1"
                        >
                            Go to Dashboard
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
