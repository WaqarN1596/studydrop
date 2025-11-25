import express, { Response } from 'express';
import db from '../db/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get user profile
router.get('/:id', (req, res: Response) => {
    const { id } = req.params;

    db.get(
        'SELECT id, name, email, major, year, profilePicture, role, createdAt FROM users WHERE id = ?',
        [id],
        (err, user) => {
            if (err || !user) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json({ user });
        }
    );
});

// Update user profile
router.put('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    if (parseInt(id) !== userId) {
        return res.status(403).json({ error: 'Not authorized to update this profile' });
    }

    const { name, major, year, profilePicture } = req.body;

    db.run(
        'UPDATE users SET name = COALESCE(?, name), major = COALESCE(?, major), year = COALESCE(?, year), profilePicture = COALESCE(?, profilePicture) WHERE id = ?',
        [name, major, year, profilePicture, id],
        function (err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to update profile' });
            }

            db.get(
                'SELECT id, name, email, major, year, profilePicture, role FROM users WHERE id = ?',
                [id],
                (err, user) => {
                    if (err) {
                        return res.status(500).json({ error: 'Failed to fetch updated profile' });
                    }
                    res.json({ user });
                }
            );
        }
    );
});

// Get user's enrolled classes
router.get('/:id/classes', (req, res: Response) => {
    const { id } = req.params;

    const query = `
    SELECT classes.*, user_classes.semester
    FROM classes
    INNER JOIN user_classes ON classes.id = user_classes.classId
    WHERE user_classes.userId = ?
    ORDER BY classes.name
  `;

    db.all(query, [id], (err, classes) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch classes' });
        }
        res.json({ classes });
    });
});

// Get user's uploads
router.get('/:id/uploads', (req, res: Response) => {
    const { id } = req.params;

    const query = `
    SELECT uploads.*, classes.name as className,
           GROUP_CONCAT(upload_tags.tag) as tags
    FROM uploads
    LEFT JOIN classes ON uploads.classId = classes.id
    LEFT JOIN upload_tags ON uploads.id = upload_tags.uploadId
    WHERE uploads.userId = ?
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

export default router;
