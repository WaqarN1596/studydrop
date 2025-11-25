import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { queryOne } from '../db/postgres';

export interface AuthRequest extends Request {
    user?: {
        id: number;
        email: string;
        role: string;
        college_id?: number;
    };
    body: any;
    params: any;
    query: any;
    headers: any;
    file?: any;
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const secret = process.env.JWT_SECRET || 'fallback-secret';

    try {
        const decoded = jwt.verify(token, secret) as any;

        // We can just use the decoded token payload if it contains enough info
        // Or fetch fresh user data from DB
        const user = await queryOne('SELECT * FROM users WHERE id = $1', [decoded.id]);

        if (!user) {
            return res.status(403).json({ error: 'Invalid token' });
        }

        req.user = user;
        next();
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
