import { Router, Response } from 'express';
import pool from '../db/postgres';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Track a download
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const { uploadId } = req.body;
        const userId = req.user?.id;

        if (!uploadId) {
            return res.status(400).json({ error: 'Upload ID is required' });
        }

        await pool.query(
            'INSERT INTO download_history (user_id, upload_id) VALUES ($1, $2)',
            [userId, uploadId]
        );

        res.status(201).json({ message: 'Download tracked' });
    } catch (err) {
        console.error('Error tracking download:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get user's download history
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;

        const result = await pool.query(
            `SELECT 
                dh.id, 
                dh.downloaded_at, 
                dh.upload_id,
                u.title, 
                u.original_filename, 
                u.file_path, 
                u.mime_type, 
                u.file_size, 
                u.category,
                c.name as class_name,
                c.code as class_code,
                users.name as uploader_name
            FROM download_history dh
            JOIN uploads u ON dh.upload_id = u.id
            JOIN classes c ON u.class_id = c.id
            JOIN users ON u.user_id = users.id
            WHERE dh.user_id = $1
            ORDER BY dh.downloaded_at DESC`,
            [userId]
        );

        res.json({ downloads: result.rows });
    } catch (err) {
        console.error('Error fetching download history:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
