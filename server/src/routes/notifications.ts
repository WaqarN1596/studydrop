import express, { Request, Response } from 'express';
import { query, queryOne, queryAll } from '../db/postgres';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get user notifications
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;

        const notifications = await queryAll(
            `SELECT * FROM notifications 
             WHERE user_id = $1 
             ORDER BY created_at DESC 
             LIMIT 50`,
            [userId]
        );

        res.json({ notifications });
    } catch (error: any) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// Mark notification as read
router.put('/:id/read', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        // Verify ownership
        const notification = await queryOne(
            'SELECT * FROM notifications WHERE id = $1 AND user_id = $2',
            [id, userId]
        );

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        // Mark as read
        await query(
            'UPDATE notifications SET is_read = true WHERE id = $1',
            [id]
        );

        res.json({ message: 'Notification marked as read' });
    } catch (error: any) {
        console.error('Mark notification read error:', error);
        res.status(500).json({ error: 'Failed to update notification' });
    }
});

// Mark all notifications as read
router.put('/read-all', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;

        await query(
            'UPDATE notifications SET is_read = true WHERE user_id = $1',
            [userId]
        );

        res.json({ message: 'All notifications marked as read' });
    } catch (error: any) {
        console.error('Mark all read error:', error);
        res.status(500).json({ error: 'Failed to update notifications' });
    }
});

export default router;
