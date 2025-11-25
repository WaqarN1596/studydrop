import express, { Response } from 'express';
import db from '../db/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get user notifications
router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;

    db.all(
        'SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC LIMIT 50',
        [userId],
        (err, notifications: any[]) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to fetch notifications' });
            }

            const formattedNotifications = notifications.map(notif => ({
                ...notif,
                data: notif.data ? JSON.parse(notif.data) : null,
                read: Boolean(notif.read)
            }));

            res.json({ notifications: formattedNotifications });
        }
    );
});

// Mark notification as read
router.post('/read', authenticateToken, (req: AuthRequest, res: Response) => {
    const { notificationId } = req.body;
    const userId = req.user?.id;

    if (!notificationId) {
        return res.status(400).json({ error: 'Notification ID is required' });
    }

    db.run(
        'UPDATE notifications SET read = 1 WHERE id = ? AND userId = ?',
        [notificationId, userId],
        function (err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to update notification' });
            }
            res.json({ message: 'Notification marked as read' });
        }
    );
});

// Mark all notifications as read
router.post('/read-all', authenticateToken, (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;

    db.run(
        'UPDATE notifications SET read = 1 WHERE userId = ?',
        [userId],
        function (err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to update notifications' });
            }
            res.json({ message: 'All notifications marked as read' });
        }
    );
});

export default router;
