import express from 'express';
import { query } from '../db/postgres';

const router = express.Router();

router.get('/db-check', async (req, res) => {
    try {
        const start = Date.now();
        const result = await query('SELECT count(*) FROM users');
        const duration = Date.now() - start;

        res.json({
            status: 'success',
            message: 'Database connection working',
            userCount: result.rows[0].count,
            duration: `${duration}ms`
        });
    } catch (error: any) {
        console.error('DB Check Error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Database connection failed',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

export default router;
