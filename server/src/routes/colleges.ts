import express from 'express';
import { query, queryAll } from '../db/postgres';

const router = express.Router();

// Get all colleges
router.get('/', async (req, res) => {
    try {
        const colleges = await queryAll('SELECT * FROM colleges ORDER BY name ASC');
        res.json({ colleges });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get majors for a specific college
router.get('/:id/majors', async (req, res) => {
    try {
        const collegeId = req.params.id;
        const majors = await queryAll('SELECT * FROM majors WHERE college_id = $1 ORDER BY name ASC', [collegeId]);
        res.json({ majors });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
