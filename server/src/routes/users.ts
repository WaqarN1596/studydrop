import express, { Response } from 'express';
import { query, queryOne, queryAll } from '../db/postgres';
import { authenticateToken, AuthRequest } from '../middleware/auth';

import { getSignedUrl } from '../middleware/supabase';

const router = express.Router();

// ... (existing code)

// Get user's uploads
router.get('/:id/uploads', async (req, res: Response) => {
    try {
        const { id } = req.params;

        const uploads = await queryAll(
            `SELECT 
                    u.id,
                    u.title,
                    u.original_filename as "originalFilename",
                    u.file_path as "url",
                    u.mime_type as "mimeType",
                    u.category,
                    u.summary,
                    u.created_at as "createdAt",
                    u.class_id as "classId",
                    u.user_id as "userId",
                    c.name as "className",
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
            if (upload.url) {
                return {
                    ...upload,
                    url: await getSignedUrl(upload.url)
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
