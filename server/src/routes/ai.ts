import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
    extractTitle,
    generateTags,
    classify,
    summarize,
    checkDuplicate,
    moderateContent,
    analyzeFile,
    semanticSearch
} from '../controllers/aiController';

const router = express.Router();

// AI endpoints
router.post('/extract-title', authenticateToken, extractTitle);
router.post('/generate-tags', authenticateToken, generateTags);
router.post('/classify', authenticateToken, classify);
router.post('/summarize', authenticateToken, summarize);
router.post('/check-duplicate', authenticateToken, checkDuplicate);
router.post('/moderate', authenticateToken, moderateContent);
router.post('/analyze', authenticateToken, analyzeFile);
router.post('/search', authenticateToken, semanticSearch);

export default router;
