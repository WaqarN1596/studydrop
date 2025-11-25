import express, { Request, Response } from 'express';
import { query, queryOne, queryAll } from '../db/postgres';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { upload } from '../middleware/cloudinary'; // Use Cloudinary instead of local storage

const router = express.Router();

// Upload file
router.post('/', authenticateToken, upload.single('file'), async (req: AuthRequest, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { classId, title, summary, category, tags } = req.body;
        const userId = req.user?.id;

        if (!classId) {
            return res.status(400).json({ error: 'Class ID is required' });
        }

        // Cloudinary file details
        const filePath = (req.file as any).path; // Cloudinary URL
        const publicId = (req.file as any).filename; // Cloudinary public ID

        // Insert upload record
        const result = await query(
            `INSERT INTO uploads (class_id, user_id, original_filename, file_path, title, summary, mime_type, file_size, category) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
            [
                classId,
                userId,
                req.file.originalname,
                filePath, // Cloudinary URL
                title || req.file.originalname,
                summary,
                req.file.mimetype,
                req.file.size,
                category
            ]
        );

        const uploadId = result.rows[0].id;

        // Insert tags
        if (tags) {
            const tagArray = typeof tags === 'string' ? JSON.parse(tags) : tags;
            for (const tag of tagArray) {
                await query(
                    'INSERT INTO upload_tags (upload_id, tag) VALUES ($1, $2)',
                    [uploadId, tag]
                );
            }
        }

        // Create notifications for class members
        const members = await queryAll(
            'SELECT user_id FROM user_classes WHERE class_id = $1 AND user_id != $2',
            [classId, userId]
        );

        for (const member of members) {
            await query(
                'INSERT INTO notifications (user_id, type, message) VALUES ($1, $2, $3)',
                [
                    member.user_id,
                    'new_upload',
                    `New file uploaded: ${title || req.file.originalname}`
                ]
            );
        }

        // Fetch and return the created upload
        const upload = await queryOne(
            `SELECT u.*, 
                    us.name as uploader_name,
                    ARRAY_AGG(ut.tag) FILTER (WHERE ut.tag IS NOT NULL) as tags
             FROM uploads u
             LEFT JOIN users us ON u.user_id = us.id
             LEFT JOIN upload_tags ut ON u.id = ut.upload_id
             WHERE u.id = $1
             GROUP BY u.id, us.name`,
            [uploadId]
        );

        res.status(201).json({ upload });
    } catch (error: any) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
});

// Get single upload
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const upload = await queryOne(
            `SELECT u.*, 
                    us.name as uploader_name,
                    us.email as uploader_email,
                    ARRAY_AGG(ut.tag) FILTER (WHERE ut.tag IS NOT NULL) as tags
             FROM uploads u
             LEFT JOIN users us ON u.user_id = us.id
             LEFT JOIN upload_tags ut ON u.id = ut.upload_id
             WHERE u.id = $1
             GROUP BY u.id, us.name, us.email`,
            [id]
        );

        if (!upload) {
            return res.status(404).json({ error: 'Upload not found' });
        }

        res.json({ upload });
    } catch (error: any) {
        console.error('Error fetching upload:', error);
        res.status(500).json({ error: 'Failed to fetch upload' });
    }
});

// Delete upload
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const isAdmin = req.user?.role === 'admin';

        const upload = await queryOne(
            'SELECT * FROM uploads WHERE id = $1',
            [id]
        );

        if (!upload) {
            return res.status(404).json({ error: 'Upload not found' });
        }

        if (upload.user_id !== userId && !isAdmin) {
            return res.status(403).json({ error: 'Not authorized to delete this upload' });
        }

        // Delete from database (cascade will handle tags)
        await query('DELETE FROM uploads WHERE id = $1', [id]);

        // TODO: Delete from Cloudinary
        // const publicId = upload.file_path.split('/').pop()?.split('.')[0];
        // await deleteFile(publicId);

        res.json({ message: 'Upload deleted successfully' });
    } catch (error: any) {
        console.error('Delete error:', error);
        res.status(500).json({ error: 'Failed to delete upload' });
    }
});

// Get upload comments
router.get('/:id/comments', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const comments = await queryAll(
            `SELECT c.*, u.name as user_name, u.email as user_email
             FROM comments c
             LEFT JOIN users u ON c.user_id = u.id
             WHERE c.upload_id = $1
             ORDER BY c.created_at DESC`,
            [id]
        );

        res.json({ comments });
    } catch (error: any) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
});

export default router;
