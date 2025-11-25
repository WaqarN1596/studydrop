import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../db/database';
import { User } from '../types';

export interface AuthRequest extends Request {
    user?: User;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const secret = process.env.JWT_SECRET || 'dev-secret-key-12345';

    try {
        const decoded = jwt.verify(token, secret) as { userId: number };

        db.get('SELECT * FROM users WHERE id = ?', [decoded.userId], (err, user: User) => {
            if (err || !user) {
                return res.status(403).json({ error: 'Invalid token' });
            }

            req.user = user;
            next();
        });
    } catch (error) {
        return res.status(403).json({ error: 'Invalid token' });
    }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};
