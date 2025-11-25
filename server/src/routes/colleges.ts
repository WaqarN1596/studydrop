import express, { Response } from 'express';
import db from '../db/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get all colleges
router.get('/', (req, res: Response) => {
    db.all('SELECT * FROM colleges ORDER BY name', [], (err, colleges) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch colleges' });
        }
        res.json({ colleges });
    });
});

export default router;
