import express, { Request, Response } from 'express';
import { query, queryOne, queryAll } from '../db/postgres';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get comments for an upload
router.get('/upload/:uploadId', async (req: Request, res: Response) => {
    try {
        const { uploadId } = req.params;

        const comments = await queryAll(
            `SELECT c.*, u.name as user_name
             FROM comments c
             LEFT JOIN users u ON c.user_id = u.id
             WHERE c.upload_id = $1
             ORDER BY c.created_at ASC`,
            [uploadId]
        );

        res.json({ comments });
    } catch (error: any) {
        console.error('Get comments error:', error);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
});

// Add comment to upload
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const { uploadId, content } = req.body;
        const userId = req.user?.id;

        // Sanitize content
        const sanitizedContent = content.trim();

        if (!sanitizedContent) {
            return res.status(400).json({ error: 'Comment cannot be empty' });
        }

        // Insert comment
        const result = await query(
            'INSERT INTO comments (upload_id, user_id, content) VALUES ($1, $2, $3) RETURNING *',
            [uploadId, userId, sanitizedContent]
        );

        const comment = result.rows[0];

        // Get upload owner
        const upload = await queryOne(
            'SELECT user_id, title FROM uploads WHERE id = $1',
            [uploadId]
        );

        // Create notification for upload owner (if not self)
        if (upload && upload.user_id !== userId) {
            await query(
                'INSERT INTO notifications (user_id, type, message) VALUES ($1, $2, $3)',
                [
                    upload.user_id,
                    'new_comment',
                    `New comment on your upload: ${upload.title}`
                ]
            );
        }

        // Get comment with user info
        const fullComment = await queryOne(
            `SELECT c.*, u.name as user_name, u.email as user_email
             FROM comments c
             LEFT JOIN users u ON c.user_id = u.id
             WHERE c.id = $1`,
            [comment.id]
        );

        res.status(201).json({ comment: fullComment });
    } catch (error: any) {
        console.error('Add comment error:', error);
        res.status(500).json({ error: 'Failed to add comment' });
    }
});

// Delete comment
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const isAdmin = req.user?.role === 'admin';

        // Check ownership
        const comment = await queryOne(
            'SELECT * FROM comments WHERE id = $1',
            [id]
        );

        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        if (comment.user_id !== userId && !isAdmin) {
            return res.status(403).json({ error: 'Not authorized to delete this comment' });
        }

        // Delete comment
        await query('DELETE FROM comments WHERE id = $1', [id]);

        res.json({ message: 'Comment deleted successfully' });
    } catch (error: any) {
        console.error('Delete comment error:', error);
        res.status(500).json({ error: 'Failed to delete comment' });
    }
});

export default router;
