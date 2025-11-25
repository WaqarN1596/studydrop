import express, { Request, Response } from 'express';
import db from '../db/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get all classes (with optional college filter)
router.get('/', (req: Request, res: Response) => {
    const { collegeId } = req.query;

    let query = 'SELECT * FROM classes';
    const params: any[] = [];

    if (collegeId) {
        query += ' WHERE collegeId = ?';
        params.push(collegeId);
    }

    query += ' ORDER BY name';

    db.all(query, params, (err, classes) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch classes' });
        }
        res.json({ classes });
    });
});

// Get single class details
router.get('/:id', (req: Request, res: Response) => {
    const { id } = req.params;

    db.get('SELECT * FROM classes WHERE id = ?', [id], (err, classData) => {
        if (err || !classData) {
            return res.status(404).json({ error: 'Class not found' });
        }
        res.json({ class: classData });
    });
});

// Create custom class
router.post('/', authenticateToken, (req: AuthRequest, res: Response) => {
    const { collegeId, name, code, description } = req.body;

    if (!collegeId || !name || !code) {
        return res.status(400).json({ error: 'College ID, name, and code are required' });
    }

    db.run(
        'INSERT INTO classes (collegeId, name, code, description) VALUES (?, ?, ?, ?)',
        [collegeId, name, code, description],
        function (err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to create class' });
            }

            db.get('SELECT * FROM classes WHERE id = ?', [this.lastID], (err, newClass) => {
                if (err) {
                    return res.status(500).json({ error: 'Failed to fetch created class' });
                }
                res.status(201).json({ class: newClass });
            });
        }
    );
});

// Join a class
router.post('/join', authenticateToken, (req: AuthRequest, res: Response) => {
    const { classId, semester } = req.body;
    const userId = req.user?.id;

    if (!classId) {
        return res.status(400).json({ error: 'Class ID is required' });
    }

    db.run(
        'INSERT OR IGNORE INTO user_classes (userId, classId, semester) VALUES (?, ?, ?)',
        [userId, classId, semester || 'Fall 2024'],
        function (err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to join class' });
            }

            if (this.changes === 0) {
                return res.status(400).json({ error: 'Already enrolled in this class' });
            }

            res.status(201).json({ message: 'Successfully joined class' });
        }
    );
});

// Leave a class
router.post('/leave', authenticateToken, (req: AuthRequest, res: Response) => {
    const { classId } = req.body;
    const userId = req.user?.id;

    if (!classId) {
        return res.status(400).json({ error: 'Class ID is required' });
    }

    db.run(
        'DELETE FROM user_classes WHERE userId = ? AND classId = ?',
        [userId, classId],
        function (err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to leave class' });
            }

            if (this.changes === 0) {
                return res.status(400).json({ error: 'Not enrolled in this class' });
            }

            res.json({ message: 'Successfully left class' });
        }
    );
});

// Get class uploads
router.get('/:id/uploads', (req: Request, res: Response) => {
    const { id } = req.params;

    const query = `
    SELECT uploads.*, users.name as uploaderName,
           GROUP_CONCAT(upload_tags.tag) as tags
    FROM uploads
    LEFT JOIN users ON uploads.userId = users.id
    LEFT JOIN upload_tags ON uploads.id = upload_tags.uploadId
    WHERE uploads.classId = ?
    GROUP BY uploads.id
    ORDER BY uploads.createdAt DESC
  `;

    db.all(query, [id], (err, uploads) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch uploads' });
        }

        const formattedUploads = uploads.map((upload: any) => ({
            ...upload,
            tags: upload.tags ? upload.tags.split(',') : []
        }));

        res.json({ uploads: formattedUploads });
    });
});

// Get class discussions (comments from all uploads in class)
router.get('/:id/discussions', (req: Request, res: Response) => {
    const { id } = req.params;

    const query = `
    SELECT comments.*, users.name as userName, uploads.title as uploadTitle
    FROM comments
    LEFT JOIN users ON comments.userId = users.id
    LEFT JOIN uploads ON comments.uploadId = uploads.id
    WHERE uploads.classId = ?
    ORDER BY comments.createdAt DESC
    LIMIT 50
  `;

    db.all(query, [id], (err, discussions) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch discussions' });
        }
        res.json({ discussions });
    });
});

export default router;
