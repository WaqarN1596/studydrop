import express from 'express';
import { queryOne } from '../db/postgres';

const router = express.Router();

router.get('/user-debug/:email', async (req, res) => {
    try {
        const email = req.params.email;
        const user = await queryOne('SELECT * FROM users WHERE email = $1', [email]);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Return keys and values to see exactly what we get
        res.json({
            keys: Object.keys(user),
            user: user
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
