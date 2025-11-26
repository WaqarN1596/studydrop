import express, { Request, Response } from 'express';
import { query, queryAll, queryOne } from '../db/postgres';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get flashcard sets for a specific upload
router.get('/upload/:uploadId', async (req: Request, res: Response) => {
    try {
        const { uploadId } = req.params;

        const sets = await queryAll(
            `SELECT id, upload_id, user_id, title, card_count, created_at
             FROM flashcard_sets
             WHERE upload_id = $1
             ORDER BY created_at DESC`,
            [uploadId]
        );

        res.json({ sets });
    } catch (error: any) {
        console.error('Get flashcard sets error:', error);
        res.status(500).json({ error: 'Failed to fetch flashcard sets' });
    }
});

// Get all flashcards in a set
router.get('/set/:setId', async (req: Request, res: Response) => {
    try {
        const { setId } = req.params;

        // Get set details
        const set = await queryOne(
            'SELECT * FROM flashcard_sets WHERE id = $1',
            [setId]
        );

        if (!set) {
            return res.status(404).json({ error: 'Flashcard set not found' });
        }

        // Get all flashcards in this set
        const flashcards = await queryAll(
            `SELECT id, question, answer, card_order
             FROM flashcards
             WHERE set_id = $1
             ORDER BY card_order ASC`,
            [setId]
        );

        res.json({
            set,
            flashcards
        });
    } catch (error: any) {
        console.error('Get flashcards error:', error);
        res.status(500).json({ error: 'Failed to fetch flashcards' });
    }
});

// Get all flashcard sets for a user
router.get('/user/:userId', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.params;
        const requestUserId = req.user?.id;

        // Verify user is requesting their own flashcards
        if (parseInt(userId) !== requestUserId) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const sets = await queryAll(
            `SELECT fs.*, u.title as upload_title
             FROM flashcard_sets fs
             LEFT JOIN uploads u ON fs.upload_id = u.id
             WHERE fs.user_id = $1
             ORDER BY fs.created_at DESC`,
            [userId]
        );

        res.json({ sets });
    } catch (error: any) {
        console.error('Get user flashcards error:', error);
        res.status(500).json({ error: 'Failed to fetch flashcards' });
    }
});

// Delete a flashcard set
router.delete('/set/:setId', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const { setId } = req.params;
        const userId = req.user?.id;

        // Check ownership
        const set = await queryOne(
            'SELECT user_id FROM flashcard_sets WHERE id = $1',
            [setId]
        );

        if (!set) {
            return res.status(404).json({ error: 'Flashcard set not found' });
        }

        if (set.user_id !== userId) {
            return res.status(403).json({ error: 'Not authorized to delete this set' });
        }

        // Delete set (flashcards will be deleted via CASCADE)
        await query('DELETE FROM flashcard_sets WHERE id = $1', [setId]);

        res.json({ message: 'Flashcard set deleted successfully' });
    } catch (error: any) {
        console.error('Delete flashcard set error:', error);
        res.status(500).json({ error: 'Failed to delete flashcard set' });
    }
});

export default router;
