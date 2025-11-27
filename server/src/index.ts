import dotenv from 'dotenv';
// Load environment variables before any other imports
dotenv.config();

import debugRouter from './routes/debug';
import testRouter from './routes/test';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import rateLimit from 'express-rate-limit';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import collegeRoutes from './routes/colleges';
import classRoutes from './routes/classes';
import uploadRoutes from './routes/uploads';
import commentRoutes from './routes/comments';
import notificationRoutes from './routes/notifications';
import adminRoutes from './routes/admin';
import aiRoutes from './routes/ai';
import downloadsRoutes from './routes/downloads';
import proxyRoutes from './routes/proxy';


// Import PostgreSQL database connection
import pool from './db/postgres';

const app = express();
const PORT = process.env.PORT || 4000;

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Increased for development - limit each IP to 1000 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(limiter);

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Serve uploaded files statically
const uploadDir = process.env.UPLOAD_DIR || './uploads';
app.use('/uploads', express.static(path.resolve(uploadDir)));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/test', testRouter);
app.use('/api/debug', debugRouter);
app.use('/api/users', userRoutes);
app.use('/api/colleges', collegeRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/downloads', downloadsRoutes);
app.use('/api/proxy', proxyRoutes);

// Health check
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Error:', err);

    if (err.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 20MB.' });
        }
        return res.status(400).json({ error: err.message });
    }

    res.status(err.status || 500).json({
        error: err.message || 'Internal server error'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🗄️  Using PostgreSQL database via Supabase`);
    console.log(`☁️  File storage: Supabase Storage`);
    console.log(`🤖 AI Features: Google Gemini`);
});

export default app;
