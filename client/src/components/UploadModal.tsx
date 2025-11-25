import { useState, useRef } from 'react';
import { uploadApi, aiApi } from '../services/api';
import { X, Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

interface UploadModalProps {
    classId: number;
    onClose: () => void;
    onComplete: () => void;
}

export default function UploadModal({ classId, onClose, onComplete }: UploadModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState('');
    const [summary, setSummary] = useState('');
    const [category, setCategory] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [aiProcessing, setAiProcessing] = useState(false);
    const [duplicateWarning, setDuplicateWarning] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Tag management functions
    const addTag = () => {
        const trimmedTag = tagInput.trim().toLowerCase();
        if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 10) {
            setTags([...tags, trimmedTag]);
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove));
    };

    const handleFileSelect = async (selectedFile: File) => {
        setFile(selectedFile);
        setError('');

        // AI Processing
        setAiProcessing(true);
        try {
            // Extract title
            const titleRes = await aiApi.extractTitle({ filename: selectedFile.name });
            setTitle(titleRes.data.title);

            // Generate tags
            const tagsRes = await aiApi.generateTags({ filename: selectedFile.name });
            setTags(tagsRes.data.tags);

            // Classify
            const classifyRes = await aiApi.classify({ filename: selectedFile.name });
            setCategory(classifyRes.data.category);

            // Generate summary
            const summaryRes = await aiApi.summarize({ filename: selectedFile.name, category: classifyRes.data.category });
            setSummary(summaryRes.data.summary);

            // Check duplicate
            const dupRes = await aiApi.checkDuplicate({ filename: selectedFile.name, classId });
            if (dupRes.data.isDuplicate) {
                setDuplicateWarning(dupRes.data.matchedFile);
            }
        } catch (err) {
            console.error('AI processing error:', err);
        } finally {
            setAiProcessing(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            handleFileSelect(droppedFile);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setUploading(true);
        setError('');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('classId', classId.toString());
        formData.append('title', title);
        formData.append('summary', summary);
        formData.append('category', category);
        formData.append('tags', JSON.stringify(tags));

        try {
            await uploadApi.uploadFile(formData);
            onComplete();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">Upload File</h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {error && (
                        <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg mb-4">
                            {error}
                        </div>
                    )}

                    {duplicateWarning && (
                        <div className="bg-yellow-100 dark:bg-yellow-900 border border-yellow-400 text-yellow-700 dark:text-yellow-200 px-4 py-3 rounded-lg mb-4 flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold">Possible duplicate detected</p>
                                <p className="text-sm">Similar file: {duplicateWarning.title}</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* File Drop Zone */}
                        {!file ? (
                            <div
                                onDrop={handleDrop}
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${isDragging
                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                    : 'border-gray-300 dark:border-gray-600 hover:border-primary-400'
                                    }`}
                            >
                                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600 dark:text-gray-400 mb-2">
                                    Drag & drop your file here, or click to browse
                                </p>
                                <p className="text-sm text-gray-500">PDF, JPG, PNG (max 20MB)</p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                                    className="hidden"
                                />
                            </div>
                        ) : (
                            <div className="border-2 border-primary-500 rounded-lg p-4 bg-primary-50 dark:bg-primary-900/20">
                                <div className="flex items-center gap-3">
                                    <FileText className="w-8 h-8 text-primary-600" />
                                    <div className="flex-1">
                                        <p className="font-medium">{file.name}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                    {aiProcessing ? (
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                                    ) : (
                                        <CheckCircle className="w-6 h-6 text-green-600" />
                                    )}
                                </div>
                            </div>
                        )}

                        {file && !aiProcessing && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Title</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="input"
                                        placeholder="Auto-generated by AI"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Summary</label>
                                    <textarea
                                        value={summary}
                                        onChange={(e) => setSummary(e.target.value)}
                                        className="input"
                                        rows={3}
                                        placeholder="Auto-generated summary"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Category</label>
                                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">
                                        <option value="exam">Exam</option>
                                        <option value="quiz">Quiz</option>
                                        <option value="homework">Homework</option>
                                        <option value="notes">Notes</option>
                                        <option value="lab">Lab</option>
                                        <option value="project">Project</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Tags</label>

                                    {/* Tag Input */}
                                    <div className="flex gap-2 mb-3">
                                        <input
                                            type="text"
                                            value={tagInput}
                                            onChange={(e) => setTagInput(e.target.value)}
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    addTag();
                                                }
                                            }}
                                            className="input flex-1"
                                            placeholder="Add a tag (e.g., midterm, calculus)"
                                            maxLength={30}
                                        />
                                        <button
                                            type="button"
                                            onClick={addTag}
                                            className="btn-secondary px-4 whitespace-nowrap"
                                        >
                                            Add Tag
                                        </button>
                                    </div>

                                    {/* Tags Display */}
                                    <div className="flex flex-wrap gap-2 min-h-[2.5rem] p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900">
                                        {tags.length === 0 ? (
                                            <span className="text-sm text-gray-400 italic">No tags yet - add some above!</span>
                                        ) : (
                                            tags.map((tag, idx) => (
                                                <span
                                                    key={idx}
                                                    className="group inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-primary-500 to-purple-500 text-white rounded-full text-sm font-medium shadow-sm hover:shadow-md transition-all animate-in fade-in slide-in-from-bottom-2 duration-200"
                                                >
                                                    <span>{tag}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeTag(tag)}
                                                        className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                                                        title="Remove tag"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </span>
                                            ))
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {tags.length} tag{tags.length !== 1 ? 's' : ''} • Press Enter or click "Add Tag" to add
                                    </p>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button type="button" onClick={onClose} className="btn-secondary flex-1">
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-primary flex-1" disabled={uploading}>
                                        {uploading ? 'Uploading...' : 'Upload'}
                                    </button>
                                </div>
                            </>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}
