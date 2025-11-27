import { GoogleGenerativeAI } from '@google/generative-ai';
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';

// Initialize Google AI with Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

// Use the model requested by user which is available in their key
// Use the model requested by user which is available in their key
const PRIMARY_MODEL = 'gemini-2.5-flash-lite';
const FALLBACK_MODEL = 'gemini-2.0-flash-lite';

// Helper to get model with fallback
const getModel = (useFallback = false) => {
    const modelName = useFallback ? FALLBACK_MODEL : PRIMARY_MODEL;
    return genAI.getGenerativeModel({ model: modelName });
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
            // Send file directly to Gemini (both PDF and Images are supported natively)
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

        // Text-only prompt
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error: any) {
        console.error(`Gemini API error (${useFallback ? 'fallback' : 'primary'}):`, error.message);

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

        console.log('=== EXTRACT TITLE DEBUG ===');
        console.log('Filename:', filename);
        console.log('File received:', !!file);
        console.log('File size:', file?.size);
        console.log('File mimetype:', file?.mimetype);
        console.log('API Key present:', !!process.env.GOOGLE_AI_API_KEY);
        console.log('API Key length:', process.env.GOOGLE_AI_API_KEY?.length);
        console.log('Model:', PRIMARY_MODEL);

        const prompt = `Analyze this academic document and generate a concise title.
Rules:
- Do NOT include the class/course name in the title
- Focus on the document type and number/topic (e.g., "Exam 1", "Final Exam", "Homework 3", "Chapter 5 Notes")
- Keep it short and descriptive (max 40 characters)
- Return ONLY the title, no quotes, no explanation`;

        let title: string;

        if (file && file.buffer) {
            console.log('Processing file content with native Gemini support...');
            title = await analyzeDocument(prompt, file.buffer, file.mimetype);
            console.log('AI generated title:', title);
        } else {
            console.log('No file received, using filename fallback');
            const cleanName = getCleanFilename(filename);
            title = await analyzeDocument(`${prompt}\n\nFilename: ${cleanName}`);
            console.log('Fallback title:', title);
        }

        res.json({ title: title.trim().replace(/['"]/g, '').slice(0, 40) });
    } catch (error: any) {
        console.error('AI Title Error:', error.message);
        console.error('Error stack:', error.stack);
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

        const prompt = `Analyze this academic document and classify it into exactly ONE of these categories:
- exam (for midterms, finals, tests, practice exams)
- quiz (for short tests, pop quizzes)
- homework (for assignments, problem sets, exercises, worksheets)
- notes (for lecture notes, study guides, handwritten notes)
- lab (for lab reports, experiments, lab manuals)
- project (for term projects, presentations, papers)
- slides (for lecture slides, powerpoint presentations)
- syllabus (for course syllabus, schedule, policies)
- other (for anything else)

Rules:
1. If it looks like an assignment or questions to solve, choose "homework".
2. If it looks like a test or exam, choose "exam".
3. Return ONLY the category word (e.g., "homework"). Do not add punctuation or extra words.`;

        let response: string;

        if (file) {
            response = await analyzeDocument(prompt, file.buffer, file.mimetype);
        } else {
            response = await analyzeDocument(`${prompt}\n\nTitle: ${title || filename}`);
        }

        let category = response.trim().toLowerCase().replace(/['".]/g, '');

        // Handle common variations
        if (category.includes('assignment') || category.includes('problem') || category.includes('work')) category = 'homework';
        if (category.includes('test') || category.includes('midterm') || category.includes('final')) category = 'exam';
        if (category.includes('presentation') || category.includes('powerpoint')) category = 'slides';
        if (category.includes('syllabus')) category = 'syllabus';

        const validCategories = ['exam', 'quiz', 'homework', 'notes', 'lab', 'project', 'slides', 'syllabus', 'other'];

        console.log(`AI Classification: Raw="${response}" -> Parsed="${category}"`);

        res.json({
            category: validCategories.includes(category) ? category : 'other'
        });
    } catch (error: any) {
        console.error('AI Classify Error:', error.message);
        // Fallback based on filename if AI fails
        const name = (req.body.filename || '').toLowerCase();
        let fallback = 'notes';
        if (name.includes('hw') || name.includes('assign')) fallback = 'homework';
        if (name.includes('exam') || name.includes('test')) fallback = 'exam';
        if (name.includes('quiz')) fallback = 'quiz';
        if (name.includes('lab')) fallback = 'lab';
        if (name.includes('syllabus')) fallback = 'syllabus';

        res.json({ category: fallback });
    }
};

// 4. Generate Summary
export const summarize = async (req: AuthRequest, res: Response) => {
    try {
        const { filename, category } = req.body;
        const file = req.file;

        const prompt = `Analyze this academic ${category || 'document'} and write a very short summary.
Rules:
- Maximum 2 sentences
- Maximum 30 words
- Be extremely concise
- Focus on the main topic only
- Example: "Midterm exam covering derivatives, integrals, and limits with 5 problem sets."`;

        let summary: string;

        if (file && file.buffer) {
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

// 5. Get AI Model Info (Debug)
export const getAIModelInfo = async (req: AuthRequest, res: Response) => {
    try {
        res.json({
            model: PRIMARY_MODEL,
            fallbackModel: FALLBACK_MODEL,
            provider: 'Google Gemini',
            limits: {
                rpm: '15 RPM',
                tpm: '250k TPM',
                rpd: '1,000 RPD'
            },
            capabilities: ['text', 'pdf', 'image']
        });
    } catch (error: any) {
        res.json({ error: error.message });
    }
};

// 6. Check for Duplicate
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

// 9. Chat with Document
export const chatWithDocument = async (req: AuthRequest, res: Response) => {
    try {
        const { uploadId, message, messages = [] } = req.body;
        const userId = req.user?.id;

        if (!uploadId || !message) {
            return res.status(400).json({ error: 'Upload ID and message are required' });
        }

        // Import dependencies
        const { queryOne } = await import('../db/postgres');
        const { getSignedUrl } = await import('../middleware/supabase');
        const axios = (await import('axios')).default;

        // Fetch upload details
        const upload = await queryOne(
            'SELECT id, title, original_filename, file_path, mime_type FROM uploads WHERE id = $1',
            [uploadId]
        );

        if (!upload) {
            return res.status(404).json({ error: 'Upload not found' });
        }

        // Get signed URL
        const signedUrl = await getSignedUrl(upload.file_path);

        // Download file
        const response = await axios.get(signedUrl, {
            responseType: 'arraybuffer'
        });
        const fileBuffer = Buffer.from(response.data);

        // Initialize model
        const model = getModel();

        // Prepare history for Gemini
        const chatHistory = messages.map((msg: any) => ({
            role: msg.role === 'ai' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));

        // Construct the current prompt with the file
        const promptParts: any[] = [
            { text: `You are a helpful AI study assistant. You are analyzing the document "${upload.title || upload.original_filename}". Answer the user's question based on the document content.` },
            {
                inlineData: {
                    data: fileBuffer.toString('base64'),
                    mimeType: upload.mime_type
                }
            }
        ];

        // Add history context if exists
        if (chatHistory.length > 0) {
            promptParts.push({ text: "\n\nChat History:\n" + chatHistory.map((m: any) => `${m.role}: ${m.parts[0].text}`).join("\n") });
        }

        promptParts.push({ text: `\n\nUser Question: ${message}` });

        const result = await model.generateContent(promptParts);
        const responseText = result.response.text();

        res.json({
            response: responseText
        });

    } catch (error: any) {
        console.error('Chat Error:', error);
        res.status(500).json({
            error: `Failed to chat with document: ${error.message}`
        });
    }
};


