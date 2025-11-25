import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi, collegeApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { UserPlus, Loader2 } from 'lucide-react';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [collegeId, setCollegeId] = useState<number | ''>('');
    const [colleges, setColleges] = useState<any[]>([]);
    const [year, setYear] = useState<number>(1);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);

    useEffect(() => {
        collegeApi.getColleges()
            .then(res => setColleges(res.data.colleges))
            .catch(err => console.error('Failed to fetch colleges', err));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authApi.register({ name, email, password, collegeId, year });
            setAuth(response.data.user, response.data.token);
            navigate('/onboarding');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4 py-12 transition-colors duration-300">
            <div className="card max-w-md w-full animate-slide-up shadow-2xl border-t-4 border-primary-500">
                <div className="text-center mb-8">
                    <div className="inline-block p-4 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full mb-4 shadow-lg shadow-primary-500/30 transform hover:scale-110 transition-transform duration-300">
                        <UserPlus className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-purple-600">Create Account</h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">Join the student community today</p>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2 animate-shake">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Full Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="input bg-gray-50 dark:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-800 transition-colors"
                            placeholder="John Doe"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input bg-gray-50 dark:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-800 transition-colors"
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input bg-gray-50 dark:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-800 transition-colors"
                            placeholder="••••••••"
                            minLength={6}
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">College / University</label>
                        <select
                            value={collegeId}
                            onChange={(e) => setCollegeId(Number(e.target.value))}
                            className="input bg-gray-50 dark:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-800 transition-colors"
                            required
                        >
                            <option value="">Select your school...</option>
                            {colleges.map((college) => (
                                <option key={college.id} value={college.id}>
                                    {college.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Year</label>
                        <select
                            value={year}
                            onChange={(e) => setYear(parseInt(e.target.value))}
                            className="input bg-gray-50 dark:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-800 transition-colors"
                            required
                        >
                            <option value={1}>Freshman (1st year)</option>
                            <option value={2}>Sophomore (2nd year)</option>
                            <option value={3}>Junior (3rd year)</option>
                            <option value={4}>Senior (4th year)</option>
                            <option value={5}>Graduate</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="btn-primary w-full py-3 text-lg font-bold shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 transition-all transform hover:-translate-y-0.5 mt-2"
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Sign Up'}
                    </button>
                </form>

                <div className="mt-8 text-center pt-6 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-gray-600 dark:text-gray-400">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary-600 hover:text-primary-700 font-bold hover:underline transition-colors">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
