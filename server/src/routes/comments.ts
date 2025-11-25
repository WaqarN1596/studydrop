import express, { Request, Response } from 'express';
import db from '../db/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Add comment to upload
router.post('/', authenticateToken, (req: AuthRequest, res: Response) => {
    const { uploadId, content } = req.body;
    const userId = req.user?.id;

    if (!uploadId || !content) {
        return res.status(400).json({ error: 'Upload ID and content are required' });
    }

    // Sanitize content (basic XSS prevention)
    const sanitizedContent = content.replace(/<script>/gi, '').replace(/<\/script>/gi, '');

    db.run(
        'INSERT INTO comments (uploadId, userId, content) VALUES (?, ?, ?)',
        [uploadId, userId, sanitizedContent],
        function (err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to add comment' });
            }

            // Notify upload owner
            db.get('SELECT userId FROM uploads WHERE id = ?', [uploadId], (err, upload: any) => {
                if (!err && upload && upload.userId !== userId) {
                    db.run(
                        'INSERT INTO notifications (userId, type, data) VALUES (?, ?, ?)',
                        [upload.userId, 'new_comment', JSON.stringify({ uploadId, commentId: this.lastID })]
                    );
                }
            });

            db.get(
                `SELECT comments.*, users.name as userName, users.profilePicture
         FROM comments
         LEFT JOIN users ON comments.userId = users.id
         WHERE comments.id = ?`,
                [this.lastID],
                (err, comment) => {
                    if (err) {
                        return res.status(500).json({ error: 'Failed to fetch comment' });
                    }
                    res.status(201).json({ comment });
                }
            );
        }
    );
});

export default router;
