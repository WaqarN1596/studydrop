import { GoogleGenerativeAI } from '@google/generative-ai';
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import pdfParse from 'pdf-parse';

// Initialize Google AI with Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');
const PRIMARY_MODEL = 'gemini-2.0-flash-exp'; // Latest available model
const FALLBACK_MODEL = 'gemini-1.5-flash';

// Helper to get model with fallback
const getModel = (useFallback = false) => {
    const modelName = useFallback ? FALLBACK_MODEL : PRIMARY_MODEL;
    return genAI.getGenerativeModel({ model: modelName });
};

// Helper to extract text from PDF buffer
const extractPDFText = async (fileBuffer: Buffer): Promise<string> => {
    try {
        const data = await pdfParse(fileBuffer);
        return data.text.slice(0, 15000); // Limit to first 15k chars for API
    } catch (error) {
        console.error('PDF extraction error:', error);
        return '';
    }
};

// Helper to analyze document with Gemini
const analyzeDocument = async (
    prompt: string,
    fileBuffer?: Buffer,
    mimeType?: string,
    useFallback = false
): Promise<string> => {
    try {
        const model = getModel(useFallback);

        if (fileBuffer && mimeType) {
            // For PDFs, extract text first
            if (mimeType.includes('pdf')) {
                const text = await extractPDFText(fileBuffer);
                if (text) {
                    const result = await model.generateContent(`${prompt}\n\nDocument content:\n${text}`);
                    return result.response.text();
                }
            }

            // For images, send directly to Gemini
            if (mimeType.includes('image')) {
                const result = await model.generateContent([
                    prompt,
                    {
                        inlineData: {
                            data: fileBuffer.toString('base64'),
                            mimeType
                        }
                    }
                ]);
                return result.response.text();
            }
        }

        // Text-only prompt (fallback)
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error: any) {
        console.error('Gemini API error:', error.message);

        // Try fallback model if primary fails
        if (!useFallback) {
            console.log('Retrying with fallback model...');
            return analyzeDocument(prompt, fileBuffer, mimeType, true);
        }

        throw error;
    }
};

// Helper to clean filename
const getCleanFilename = (filename: string): string => {
    return filename
        .replace(/\.[^/.]+$/, '')
        .replace(/[_-]/g, ' ')
        .replace(/\d+/g, '')
        .trim();
};

// 1. Extract Title from document content
export const extractTitle = async (req: AuthRequest, res: Response) => {
    try {
        const { filename } = req.body;
        const file = req.file;

        const prompt = `Analyze this academic document and generate a concise, professional title (max 60 characters). 
Return ONLY the title, nothing else. No quotes, no explanation.`;

        let title: string;

        if (file) {
            // Use actual file content
            title = await analyzeDocument(prompt, file.buffer, file.mimetype);
        } else {
            // Fallback to filename-based generation
            const cleanName = getCleanFilename(filename);
            title = await analyzeDocument(`${prompt}\n\nFilename: ${cleanName}`);
        }

        res.json({ title: title.trim().replace(/['"]/g, '').slice(0, 60) });
    } catch (error: any) {
        console.error('AI Title Error:', error.message);
        const { filename } = req.body;
        const fallbackTitle = getCleanFilename(filename);
        res.json({ title: fallbackTitle });
    }
};

// 2. Generate Tags from document content
export const generateTags = async (req: AuthRequest, res: Response) => {
    try {
        const { filename, title } = req.body;
        const file = req.file;

        const prompt = `Analyze this academic document and generate exactly 5 relevant tags.
Return ONLY comma-separated tags, no numbering, no explanation.
Tags should be: lowercase, single words or short phrases, relevant to the content.`;

        let response: string;

        if (file) {
            response = await analyzeDocument(prompt, file.buffer, file.mimetype);
        } else {
            response = await analyzeDocument(`${prompt}\n\nTitle: ${title || filename}`);
        }

        const tags = response
            .split(',')
            .map(tag => tag.trim().toLowerCase().replace(/['"]/g, ''))
            .filter(tag => tag.length > 0 && tag.length < 30)
            .slice(0, 5);

        res.json({ tags: tags.length > 0 ? tags : ['study', 'notes', 'academic'] });
    } catch (error: any) {
        console.error('AI Tags Error:', error.message);
        res.json({ tags: ['study', 'notes', 'academic'] });
    }
};

// 3. Classify Document Category
export const classify = async (req: AuthRequest, res: Response) => {
    try {
        const { filename, title } = req.body;
        const file = req.file;

        const prompt = `Analyze this academic document and classify it into ONE category.
Categories: exam, quiz, homework, notes, lab, project, slides, other
Return ONLY the category name, nothing else.`;

        let response: string;

        if (file) {
            response = await analyzeDocument(prompt, file.buffer, file.mimetype);
        } else {
            response = await analyzeDocument(`${prompt}\n\nTitle: ${title || filename}`);
        }

        const category = response.trim().toLowerCase();
        const validCategories = ['exam', 'quiz', 'homework', 'notes', 'lab', 'project', 'slides', 'other'];

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
        const { filename, category } = req.body;
        const file = req.file;

        const prompt = `Analyze this academic ${category || 'document'} and write a brief 1-2 sentence summary.
Be concise, informative, and academic. Return ONLY the summary.`;

        let summary: string;

        if (file) {
            summary = await analyzeDocument(prompt, file.buffer, file.mimetype);
        } else {
            summary = await analyzeDocument(`${prompt}\n\nFilename: ${filename}`);
        }

        res.json({ summary: summary.trim() });
    } catch (error: any) {
        console.error('AI Summary Error:', error.message);
        const { category } = req.body;
        res.json({
            summary: `Academic ${category || 'document'} for study purposes.`
        });
    }
};

// 5. Check for Duplicate
export const checkDuplicate = async (req: AuthRequest, res: Response) => {
    try {
        res.json({
            isDuplicate: false,
            matchedFile: null
        });
    } catch (error: any) {
        console.error('Duplicate Check Error:', error.message);
        res.json({ isDuplicate: false, matchedFile: null });
    }
};

// 6. Moderate Content
export const moderateContent = async (req: AuthRequest, res: Response) => {
    try {
        const { content } = req.body;

        const prompt = `Analyze this text for inappropriate content (spam, offensive language, etc.).
Return ONLY "appropriate" or "inappropriate".
Text: ${content}`;

        const response = await analyzeDocument(prompt);
        const isAppropriate = response.toLowerCase().includes('appropriate') &&
            !response.toLowerCase().includes('inappropriate');

        res.json({
            isAppropriate,
            reason: isAppropriate ? null : 'Contains inappropriate content'
        });
    } catch (error: any) {
        console.error('Moderation Error:', error.message);
        res.json({ isAppropriate: true, reason: null });
    }
};

// 7. Analyze File
export const analyzeFile = async (req: AuthRequest, res: Response) => {
    try {
        const { filename, fileSize, mimeType } = req.body;

        res.json({
            insights: {
                pageCount: Math.floor(fileSize / 50000),
                readingTime: Math.ceil(fileSize / 100000),
                fileType: mimeType.split('/')[1].toUpperCase(),
                complexity: fileSize > 1000000 ? 'high' : 'medium'
            }
        });
    } catch (error: any) {
        console.error('Analysis Error:', error.message);
        res.json({ insights: {} });
    }
};

// 8. Semantic Search
export const semanticSearch = async (req: AuthRequest, res: Response) => {
    try {
        res.json({ results: [] });
    } catch (error: any) {
        console.error('Search Error:', error.message);
        res.json({ results: [] });
    }
};
