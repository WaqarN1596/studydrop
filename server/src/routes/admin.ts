import express, { Response } from 'express';
import { query, queryOne, queryAll } from '../db/postgres';
import { authenticateToken, AuthRequest, requireAdmin } from '../middleware/auth';

const router = express.Router();

// All routes require admin authentication
router.use(authenticateToken);
router.use(requireAdmin);

// Get all uploads (with pagination)
router.get('/uploads', async (req: AuthRequest, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;

        const uploads = await queryAll(
            `SELECT u.*, us.name as uploader_name, c.name as class_name,
                    ARRAY_AGG(ut.tag) FILTER (WHERE ut.tag IS NOT NULL) as tags
             FROM uploads u
             LEFT JOIN users us ON u.user_id = us.id
             LEFT JOIN classes c ON u.class_id = c.id
             LEFT JOIN upload_tags ut ON u.id = ut.upload_id
             GROUP BY u.id, us.name, c.name
             ORDER BY u.created_at DESC
             LIMIT $1 OFFSET $2`,
            [limit, offset]
        );

        res.json({ uploads });
    } catch (error: any) {
        console.error('Admin get uploads error:', error);
        res.status(500).json({ error: 'Failed to fetch uploads' });
    }
});

// Delete upload (admin)
router.delete('/uploads/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const upload = await queryOne(
            'SELECT * FROM uploads WHERE id = $1',
            [id]
        );

        if (!upload) {
            return res.status(404).json({ error: 'Upload not found' });
        }

        await query('DELETE FROM uploads WHERE id = $1', [id]);

        res.json({ message: 'Upload deleted successfully' });
    } catch (error: any) {
        console.error('Admin delete upload error:', error);
        res.status(500).json({ error: 'Failed to delete upload' });
    }
});

// Get all users
router.get('/users', async (req: AuthRequest, res: Response) => {
    try {
        const users = await queryAll(
            `SELECT u.id, u.name, u.email, u.major, u.year, u.role, u.created_at,
                    COUNT(up.id) as upload_count
             FROM users u
             LEFT JOIN uploads up ON u.id = up.user_id
             GROUP BY u.id
             ORDER BY u.created_at DESC`
        );

        res.json({ users });
    } catch (error: any) {
        console.error('Admin get users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

export default router;
