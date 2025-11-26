import express, { Response } from 'express';
import { query, queryOne, queryAll } from '../db/postgres';
import { authenticateToken, AuthRequest } from '../middleware/auth';

import { getSignedUrl } from '../middleware/supabase';

const router = express.Router();

// Get user profile
router.get('/:id', async (req, res: Response) => {
    try {
        const { id } = req.params;

        const user = await queryOne(
            'SELECT id, name, email, major_id, year, role, created_at FROM users WHERE id = $1',
            [id]
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
    } catch (error: any) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// Update user profile
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        if (parseInt(id) !== userId) {
            return res.status(403).json({ error: 'Not authorized to update this profile' });
        }

        const { name, major_id, year } = req.body;

        await query(
            `UPDATE users
             SET name = COALESCE($1, name),
                 major_id = COALESCE($2, major_id),
                 year = COALESCE($3, year)
             WHERE id = $4`,
            [name, major_id, year, id]
        );

        const user = await queryOne(
            'SELECT id, name, email, major_id, year, role FROM users WHERE id = $1',
            [id]
        );

        res.json({ user });
    } catch (error: any) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Get user's enrolled classes
router.get('/:id/classes', async (req, res: Response) => {
    try {
        const { id } = req.params;

        const classes = await queryAll(
            `SELECT c.*, uc.semester
             FROM classes c
             INNER JOIN user_classes uc ON c.id = uc.class_id
             WHERE uc.user_id = $1
             ORDER BY c.name`,
            [id]
        );

        res.json({ classes });
    } catch (error: any) {
        console.error('Get user classes error:', error);
        res.status(500).json({ error: 'Failed to fetch classes' });
    }
});

// Get user's uploads
router.get('/:id/uploads', async (req, res: Response) => {
    try {
        const { id } = req.params;

        const uploads = await queryAll(
            `SELECT u.*, c.name as class_name,
                    ARRAY_AGG(ut.tag) FILTER (WHERE ut.tag IS NOT NULL) as tags
             FROM uploads u
             LEFT JOIN classes c ON u.class_id = c.id
             LEFT JOIN upload_tags ut ON u.id = ut.upload_id
             WHERE u.user_id = $1
             GROUP BY u.id, c.name
             ORDER BY u.created_at DESC`,
            [id]
        );

        // Sign URLs for all uploads
        const uploadsWithSignedUrls = await Promise.all(uploads.map(async (upload: any) => {
            if (upload.file_path) {
                const signedUrl = await getSignedUrl(upload.file_path);
                return {
                    ...upload,
                    file_path: signedUrl
                };
            }
            return upload;
        }));

        res.json({ uploads: uploadsWithSignedUrls });
    } catch (error: any) {
        console.error('Get user uploads error:', error);
        res.status(500).json({ error: 'Failed to fetch uploads' });
    }
});

export default router;
