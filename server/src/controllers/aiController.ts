import { GoogleGenerativeAI } from '@google/generative-ai';
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';

// Initialize Google AI with Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

// Use the model requested by user which is available in their key
// Use the model requested by user which is available in their key
const PRIMARY_MODEL = 'gemini-1.5-flash';
const FALLBACK_MODEL = 'gemini-1.5-pro';

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

        const prompt = `Analyze this academic document and classify it into ONE category.

Available categories:
- exam (midterm, final, test)
- quiz (short test, pop quiz)
- homework (assignments, problem sets)
- notes (lecture notes, study notes)
- lab (lab reports, experiments)
- project (term projects, presentations)
- slides (PowerPoint, lecture slides)
- other (anything else)

Return ONLY the category name (lowercase), nothing else.`;

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

// 9. Generate Flashcards from PDF
export const generateFlashcards = async (req: AuthRequest, res: Response) => {
    try {
        const { uploadId, count = 15 } = req.body;
        const userId = req.user?.id;

        if (!uploadId) {
            return res.status(400).json({ error: 'Upload ID is required' });
        }

        // Import dependencies
        const pdfParse = require('pdf-parse');
        const { queryOne, query } = await import('../db/postgres');
        const { getSignedUrl } = await import('../middleware/supabase');
        const axios = (await import('axios')).default;

        // Fetch upload details
        const upload = await queryOne(
            'SELECT id, user_id, title, original_filename, file_path, mime_type FROM uploads WHERE id = $1',
            [uploadId]
        );

        if (!upload) {
            return res.status(404).json({ error: 'Upload not found' });
        }

        if (!upload.mime_type?.includes('pdf')) {
            return res.status(400).json({ error: 'Only PDF files are supported for flashcard generation' });
        }

        // Get signed URL for the PDF
        const signedUrl = await getSignedUrl(upload.file_path);

        // Download PDF file
        console.log('Downloading PDF from:', signedUrl);
        const response = await axios.get(signedUrl, {
            responseType: 'arraybuffer'
        });

        const pdfBuffer = Buffer.from(response.data);

        // Extract text from PDF
        console.log('Extracting text from PDF...');
        const pdfData = await pdfParse(pdfBuffer);
        const extractedText = pdfData.text.trim();

        if (!extractedText || extractedText.length < 100) {
            return res.status(400).json({
                error: 'Could not extract enough text from PDF. The document may be scanned or image-based.'
            });
        }

        // Truncate text if too long (Gemini has token limits)
        const maxLength = 30000; // ~7500 words
        const textToAnalyze = extractedText.length > maxLength
            ? extractedText.substring(0, maxLength) + '...'
            : extractedText;

        console.log('Extracted text length:', textToAnalyze.length);

        // Generate flashcards using Gemini
        const prompt = `Generate ${count} study flashcards from the following document text.
Return a JSON array of objects with EXACTLY these fields: "question" and "answer".
Focus on key concepts, definitions, important facts, and exam-worthy material.
Make questions clear and concise. Make answers thorough but not overly long.
Return ONLY valid JSON, no markdown formatting, no code blocks, no additional text.

Document text:
${textToAnalyze}

Return format example:
[{"question": "What is X?", "answer": "X is..."},{"question": "Define Y", "answer": "Y is defined as..."}]`;

        console.log('Generating flashcards with Gemini...');
        const aiResponse = await analyzeDocument(prompt);

        // Clean up the response - remove markdown code blocks if present
        let cleanedResponse = aiResponse.trim();
        if (cleanedResponse.startsWith('```json')) {
            cleanedResponse = cleanedResponse.replace(/^```json\n/, '').replace(/\n```$/, '');
        } else if (cleanedResponse.startsWith('```')) {
            cleanedResponse = cleanedResponse.replace(/^```\n/, '').replace(/\n```$/, '');
        }

        // Parse the JSON response
        let flashcardData: Array<{ question: string; answer: string }>;
        try {
            flashcardData = JSON.parse(cleanedResponse);
        } catch (parseError) {
            console.error('Failed to parse AI response:', cleanedResponse);
            return res.status(500).json({
                error: 'AI generated invalid flashcard format. Please try again.'
            });
        }

        if (!Array.isArray(flashcardData) || flashcardData.length === 0) {
            return res.status(500).json({
                error: 'AI did not generate any flashcards. Please try again.'
            });
        }

        // Create flashcard set in database
        const setResult = await query(
            'INSERT INTO flashcard_sets (upload_id, user_id, title, card_count) VALUES ($1, $2, $3, $4) RETURNING id',
            [uploadId, userId, upload.title || upload.original_filename, flashcardData.length]
        );

        const setId = setResult.rows[0].id;

        // Insert individual flashcards
        for (let i = 0; i < flashcardData.length; i++) {
            const card = flashcardData[i];
            await query(
                'INSERT INTO flashcards (set_id, question, answer, card_order) VALUES ($1, $2, $3, $4)',
                [setId, card.question, card.answer, i]
            );
        }

        console.log(`Created flashcard set with ${flashcardData.length} cards`);

        res.json({
            success: true,
            setId,
            cardCount: flashcardData.length,
            message: `Generated ${flashcardData.length} flashcards successfully!`
        });

    } catch (error: any) {
        console.error('Flashcard Generation Error:', error);
        console.error('Stack:', error.stack);
        res.status(500).json({
            error: `Failed to generate flashcards: ${error.message}`
        });
    }
};
