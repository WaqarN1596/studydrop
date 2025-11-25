import { HfInference } from '@huggingface/inference';
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';

// Initialize Hugging Face client
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY || 'demo-key');

// Helper to extract clean filename without extension
const getCleanFilename = (filename: string): string => {
    return filename
        .replace(/\.[^/.]+$/, '') // Remove extension
        .replace(/[_-]/g, ' ') // Replace underscores/hyphens with spaces
        .replace(/\d+/g, '') // Remove numbers
        .trim();
};

// 1. Extract Title from filename
export const extractTitle = async (req: AuthRequest, res: Response) => {
    try {
        const { filename } = req.body;
        const cleanName = getCleanFilename(filename);

        const result = await hf.textGeneration({
            model: 'mistralai/Mistral-7B-Instruct-v0.2',
            inputs: `Generate a concise, professional title for an academic document with this filename: "${cleanName}". Return ONLY the title, nothing else.`,
            parameters: {
                max_new_tokens: 30,
                temperature: 0.7,
                return_full_text: false
            }
        });

        const title = result.generated_text.trim().replace(/['"]/g, '');
        res.json({ title });
    } catch (error: any) {
        console.error('AI Title Error:', error.message);
        // Fallback: use cleaned filename
        const { filename } = req.body;
        const fallbackTitle = getCleanFilename(filename);
        res.json({ title: fallbackTitle });
    }
};

// 2. Generate Tags
export const generateTags = async (req: AuthRequest, res: Response) => {
    try {
        const { filename, title } = req.body;
        const content = title || getCleanFilename(filename);

        const result = await hf.textGeneration({
            model: 'mistralai/Mistral-7B-Instruct-v0.2',
            inputs: `Generate 5 relevant academic tags for: "${content}". Return ONLY comma-separated tags, no explanation.`,
            parameters: {
                max_new_tokens: 50,
                temperature: 0.5,
                return_full_text: false
            }
        });

        const tags = result.generated_text
            .split(',')
            .map(tag => tag.trim().toLowerCase())
            .filter(tag => tag.length > 0 && tag.length < 30)
            .slice(0, 5);

        res.json({ tags: tags.length > 0 ? tags : ['study', 'notes'] });
    } catch (error: any) {
        console.error('AI Tags Error:', error.message);
        res.json({ tags: ['study', 'notes', 'exam'] });
    }
};

// 3. Classify Document Category
export const classify = async (req: AuthRequest, res: Response) => {
    try {
        const { filename, title } = req.body;
        const content = title || getCleanFilename(filename);

        const result = await hf.textGeneration({
            model: 'mistralai/Mistral-7B-Instruct-v0.2',
            inputs: `Classify this academic document into ONE category: "${content}". Categories: exam, quiz, homework, notes, lab, project, slides. Return ONLY the category name.`,
            parameters: {
                max_new_tokens: 10,
                temperature: 0.3,
                return_full_text: false
            }
        });

        const category = result.generated_text.trim().toLowerCase();
        const validCategories = ['exam', 'quiz', 'homework', 'notes', 'lab', 'project', 'slides'];

        res.json({
            category: validCategories.includes(category) ? category : 'other'
        });
    } catch (error: any) {
        console.error('AI Classify Error:', error.message);
        res.json({ category: 'notes' });
    }
};

// 4. Generate Summary
export const summarize = async (req: AuthRequest, res: Response) => {
    try {
        const { filename, category = 'document' } = req.body;
        const cleanName = getCleanFilename(filename);

        const result = await hf.textGeneration({
            model: 'mistralai/Mistral-7B-Instruct-v0.2',
            inputs: `Write a brief 1-sentence summary for this ${category}: "${cleanName}". Be concise and academic.`,
            parameters: {
                max_new_tokens: 60,
                temperature: 0.7,
                return_full_text: false
            }
        });

        const summary = result.generated_text.trim();
        res.json({ summary });
    } catch (error: any) {
        console.error('AI Summary Error:', error.message);
        const { filename, category } = req.body;
        res.json({
            summary: `Academic ${category || 'document'} covering topics from ${getCleanFilename(filename)}.`
        });
    }
};

// 5. Check for Duplicate (Simple text matching - would need embeddings for real semantic search)
export const checkDuplicate = async (req: AuthRequest, res: Response) => {
    try {
        const { filename, classId } = req.body;

        // For now, return no duplicates (would need vector DB for real implementation)
        res.json({
            isDuplicate: false,
            matchedFile: null
        });
    } catch (error: any) {
        console.error('Duplicate Check Error:', error.message);
        res.json({ isDuplicate: false, matchedFile: null });
    }
};

// 6. Moderate Content (Check for inappropriate content)
export const moderateContent = async (req: AuthRequest, res: Response) => {
    try {
        const { content } = req.body;

        // Simple keyword check (would use proper moderation API in production)
        const inappropriateWords = ['spam', 'inappropriate'];
        const isInappropriate = inappropriateWords.some(word =>
            content.toLowerCase().includes(word)
        );

        res.json({
            isAppropriate: !isInappropriate,
            reason: isInappropriate ? 'Contains inappropriate content' : null
        });
    } catch (error: any) {
        console.error('Moderation Error:', error.message);
        res.json({ isAppropriate: true, reason: null });
    }
};

// 7. Analyze File (Get metadata and insights)
export const analyzeFile = async (req: AuthRequest, res: Response) => {
    try {
        const { filename, fileSize, mimeType } = req.body;

        res.json({
            insights: {
                pageCount: Math.floor(fileSize / 50000), // Rough estimate
                readingTime: Math.ceil(fileSize / 100000), // Minutes estimate
                fileType: mimeType.split('/')[1].toUpperCase(),
                complexity: fileSize > 1000000 ? 'high' : 'medium'
            }
        });
    } catch (error: any) {
        console.error('Analysis Error:', error.message);
        res.json({ insights: {} });
    }
};

// 8. Semantic Search (Would need embeddings - simplified version)
export const semanticSearch = async (req: AuthRequest, res: Response) => {
    try {
        const { query, classId } = req.body;

        // Return empty for now (would need vector embeddings for real implementation)
        res.json({ results: [] });
    } catch (error: any) {
        console.error('Search Error:', error.message);
        res.json({ results: [] });
    }
};
