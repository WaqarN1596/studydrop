import express from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth';
import {
    extractTitle,
    generateTags,
    classify,
    summarize,
    checkDuplicate,
    moderateContent,
    analyzeFile,
    semanticSearch,
    getAIModelInfo,
    chatWithDocument,
    getChatHistory
} from '../controllers/aiController';

const router = express.Router();

// Configure multer for file uploads (memory storage for AI processing)
const upload = multer({ storage: multer.memoryStorage() });

// AI endpoints - accept optional file uploads
router.get('/model-info', authenticateToken, getAIModelInfo);
router.post('/extract-title', authenticateToken, upload.single('file'), extractTitle);
router.post('/generate-tags', authenticateToken, upload.single('file'), generateTags);
router.post('/classify', authenticateToken, upload.single('file'), classify);
router.post('/summarize', authenticateToken, upload.single('file'), summarize);
router.post('/check-duplicate', authenticateToken, checkDuplicate);
router.post('/moderate', authenticateToken, moderateContent);
router.post('/analyze', authenticateToken, analyzeFile);
router.post('/search', authenticateToken, semanticSearch);
router.post('/chat', authenticateToken, chatWithDocument);
router.get('/chat/:uploadId', authenticateToken, getChatHistory);

export default router;
