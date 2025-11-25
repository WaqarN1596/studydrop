import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../db/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { User } from '../types';

const router = express.Router();

// Register
router.post('/register', async (req: Request, res: Response) => {
    const { name, email, password, major, year } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        db.run(
            'INSERT INTO users (name, email, passwordHash, major, year) VALUES (?, ?, ?, ?, ?)',
            [name, email, hashedPassword, major, year],
            function (err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(400).json({ error: 'Email already registered' });
                    }
                    return res.status(500).json({ error: 'Registration failed' });
                }

                const userId = this.lastID;
                const secret = process.env.JWT_SECRET || 'dev-secret-key-12345';
                const token = jwt.sign({ userId }, secret, { expiresIn: '7d' });

                db.get('SELECT id, name, email, major, year, role FROM users WHERE id = ?', [userId], (err, user) => {
                    if (err) {
                        return res.status(500).json({ error: 'Error fetching user' });
                    }
                    res.status(201).json({ token, user });
                });
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Login
router.post('/login', (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user: User) => {
        if (err || !user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        try {
            const validPassword = await bcrypt.compare(password, user.passwordHash);

            if (!validPassword) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const secret = process.env.JWT_SECRET || 'dev-secret-key-12345';
            const token = jwt.sign({ userId: user.id }, secret, { expiresIn: '7d' });

            const { passwordHash, ...userWithoutPassword } = user;
            res.json({ token, user: userWithoutPassword });
        } catch (error) {
            res.status(500).json({ error: 'Server error' });
        }
    });
});

// Get current user
router.get('/me', authenticateToken, (req: AuthRequest, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const { passwordHash, ...userWithoutPassword } = req.user;
    res.json({ user: userWithoutPassword });
});

export default router;
