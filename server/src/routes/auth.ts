import express, { Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query, queryOne } from '../db/postgres';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Register
router.post('/register', async (req, res: Response) => {
    try {
        const { name, email, password, major, year } = req.body;

        // Check if user exists
        const existingUser = await queryOne(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const result = await query(
            `INSERT INTO users (name, email, passwordHash, major, year, role) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, major, year, role`,
            [name, email, hashedPassword, major, year, 'student']
        );

        const user = result.rows[0];

        // Generate JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'fallback-secret',
            { expiresIn: '7d' }
        );

        res.status(201).json({ user, token });
    } catch (error: any) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login
router.post('/login', async (req, res: Response) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await queryOne(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const dbPassword = user.passwordHash || user.passwordhash; if (!dbPassword) { return res.status(500).json({ error: "Login failed: password hash missing" }); } const validPassword = await bcrypt.compare(password, dbPassword);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'fallback-secret',
            { expiresIn: '7d' }
        );

        // Return user without password
        const { passwordHash: _, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword, token });
    } catch (error: any) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get current user
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const user = await queryOne(
            'SELECT id, name, email, major, year, role, created_at FROM users WHERE id = $1',
            [req.user?.id]
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
    } catch (error: any) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
});

export default router;
