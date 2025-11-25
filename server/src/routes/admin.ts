import express, { Response } from 'express';
import db from '../db/database';
import { authenticateToken, AuthRequest, requireAdmin } from '../middleware/auth';

const router = express.Router();

// All routes require admin authentication
router.use(authenticateToken);
router.use(requireAdmin);

// Get all uploads (with pagination)
router.get('/uploads', (req: AuthRequest, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const query = `
    SELECT uploads.*, users.name as uploaderName, classes.name as className,
           GROUP_CONCAT(upload_tags.tag) as tags
    FROM uploads
    LEFT JOIN users ON uploads.userId = users.id
    LEFT JOIN classes ON uploads.classId = classes.id
    LEFT JOIN upload_tags ON uploads.id = upload_tags.uploadId
    GROUP BY uploads.id
    ORDER BY uploads.createdAt DESC
    LIMIT ? OFFSET ?
  `;

    db.all(query, [limit, offset], (err, uploads) => {
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

// Delete upload (admin)
router.delete('/uploads/:id', (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const adminId = req.user?.id;

    db.get('SELECT * FROM uploads WHERE id = ?', [id], (err, upload) => {
        if (err || !upload) {
            return res.status(404).json({ error: 'Upload not found' });
        }

        db.run('DELETE FROM uploads WHERE id = ?', [id], (err) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to delete upload' });
            }

            // Log admin action
            db.run(
                'INSERT INTO admin_logs (action, adminId, payload) VALUES (?, ?, ?)',
                ['delete_upload', adminId, JSON.stringify({ uploadId: id })]
            );

            res.json({ message: 'Upload deleted successfully' });
        });
    });
});

// Get all users
router.get('/users', (req: AuthRequest, res: Response) => {
    const query = `
    SELECT id, name, email, major, year, role, createdAt,
           (SELECT COUNT(*) FROM uploads WHERE userId = users.id) as uploadCount
    FROM users
    ORDER BY createdAt DESC
  `;

    db.all(query, [], (err, users) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch users' });
        }
        res.json({ users });
    });
});

// Get admin logs
router.get('/logs', (req: AuthRequest, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 100;

    const query = `
    SELECT admin_logs.*, users.name as adminName
    FROM admin_logs
    LEFT JOIN users ON admin_logs.adminId = users.id
    ORDER BY admin_logs.createdAt DESC
    LIMIT ?
  `;

    db.all(query, [limit], (err, logs) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch logs' });
        }

        const formattedLogs = logs.map((log: any) => ({
            ...log,
            payload: log.payload ? JSON.parse(log.payload) : null
        }));

        res.json({ logs: formattedLogs });
    });
});

export default router;
