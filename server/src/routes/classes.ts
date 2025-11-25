import express, { Request, Response } from 'express';
import { query, queryOne, queryAll } from '../db/postgres';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { getSignedUrl } from '../middleware/supabase';

const router = express.Router();

// Get all classes (with optional college filter and search)
router.get('/', async (req: Request, res: Response) => {
    try {
        const { collegeId, search } = req.query;

        let sqlQuery = 'SELECT * FROM classes WHERE 1=1';
        const params: any[] = [];

        if (collegeId) {
            params.push(collegeId);
            sqlQuery += ` AND college_id = $${params.length}`;
        }

        if (search) {
            params.push(`%${search}%`);
            sqlQuery += ` AND (name ILIKE $${params.length} OR code ILIKE $${params.length})`;
        }

        sqlQuery += ' ORDER BY name';

        const classes = await queryAll(sqlQuery, params);
        res.json({ classes });
    } catch (error: any) {
        console.error('Get classes error:', error);
        res.status(500).json({ error: 'Failed to fetch classes' });
    }
});

// Get single class details
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const classData = await queryOne(
            'SELECT * FROM classes WHERE id = $1',
            [id]
        );

        if (!classData) {
            return res.status(404).json({ error: 'Class not found' });
        }

        res.json({ class: classData });
    } catch (error: any) {
        console.error('Get class error:', error);
        res.status(500).json({ error: 'Failed to fetch class' });
    }
});

// Create custom class
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const { collegeId, name, code, description, semester } = req.body;
        const userId = req.user?.id;

        if (!collegeId || !name || !code) {
            return res.status(400).json({ error: 'College ID, name, and code are required' });
        }

        // Check for duplicate
        const existing = await queryOne(
            'SELECT * FROM classes WHERE college_id = $1 AND code = $2',
            [collegeId, code]
        );

        if (existing) {
            return res.status(400).json({ error: 'Class with this code already exists for this college' });
        }

        const result = await query(
            'INSERT INTO classes (college_id, name, code, description, semester, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [collegeId, name, code, description, semester || 'Fall 2024', userId]
        );

        const newClass = result.rows[0];

        // Automatically enroll the creator
        await query(
            'INSERT INTO user_classes (user_id, class_id, semester) VALUES ($1, $2, $3)',
            [userId, newClass.id, semester || 'Fall 2024']
        );

        res.status(201).json({ class: newClass });
    } catch (error: any) {
        console.error('Create class error:', error);
        res.status(500).json({ error: 'Failed to create class' });
    }
});

// Join a class
router.post('/join', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const { classId, semester } = req.body;
        const userId = req.user?.id;

        if (!classId) {
            return res.status(400).json({ error: 'Class ID is required' });
        }

        // Check if already enrolled
        const existing = await queryOne(
            'SELECT * FROM user_classes WHERE user_id = $1 AND class_id = $2',
            [userId, classId]
        );

        if (existing) {
            return res.status(400).json({ error: 'Already enrolled in this class' });
        }

        // Join class
        await query(
            'INSERT INTO user_classes (user_id, class_id, semester) VALUES ($1, $2, $3)',
            [userId, classId, semester || 'Fall 2024']
        );

        res.status(201).json({ message: 'Successfully joined class' });
    } catch (error: any) {
        console.error('Join class error:', error);
        res.status(500).json({ error: 'Failed to join class' });
    }
});

// Leave a class
router.post('/leave', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const { classId } = req.body;
        const userId = req.user?.id;

        if (!classId) {
            return res.status(400).json({ error: 'Class ID is required' });
        }

        const result = await query(
            'DELETE FROM user_classes WHERE user_id = $1 AND class_id = $2',
            [userId, classId]
        );

        if (result.rowCount === 0) {
            return res.status(400).json({ error: 'Not enrolled in this class' });
        }

        res.json({ message: 'Successfully left class' });
    } catch (error: any) {
        console.error('Leave class error:', error);
        res.status(500).json({ error: 'Failed to leave class' });
    }
});

// Get class uploads
router.get('/:id/uploads', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const uploads = await queryAll(
            `SELECT 
                    u.id,
                    u.class_id as "classId",
                    u.user_id as "userId",
                    u.title,
                    u.original_filename as "originalFilename",
                    u.file_path as "url",
                    u.mime_type as "mimeType",
                    u.file_size as "size",
                    u.category,
                    u.summary,
                    u.created_at as "createdAt",
                    us.name as "uploaderName",
                    ARRAY_AGG(ut.tag) FILTER (WHERE ut.tag IS NOT NULL) as tags
             FROM uploads u
             LEFT JOIN users us ON u.user_id = us.id
             LEFT JOIN upload_tags ut ON u.id = ut.upload_id
             WHERE u.class_id = $1
             GROUP BY u.id, us.name
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
        console.error('Get class uploads error:', error);
        res.status(500).json({ error: 'Failed to fetch uploads' });
    }
});

// Get class discussions (comments from all uploads in class)
router.get('/:id/discussions', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const discussions = await queryAll(
            `SELECT c.*, u.name as user_name, up.title as upload_title
             FROM comments c
             LEFT JOIN users u ON c.user_id = u.id
             LEFT JOIN uploads up ON c.upload_id = up.id
             WHERE up.class_id = $1
             ORDER BY c.created_at DESC
             LIMIT 50`,
            [id]
        );

        res.json({ discussions });
    } catch (error: any) {
        console.error('Get discussions error:', error);
        res.status(500).json({ error: 'Failed to fetch discussions' });
    }
});

export default router;
