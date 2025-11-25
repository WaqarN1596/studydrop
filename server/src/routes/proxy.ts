import express, { Response } from 'express';
import axios from 'axios';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const { url, filename, download } = req.query;

        if (!url || typeof url !== 'string') {
            return res.status(400).json({ error: 'URL is required' });
        }

        // Security check: Ensure URL is from Cloudinary (optional but recommended)
        // if (!url.includes('cloudinary.com')) {
        //     return res.status(400).json({ error: 'Invalid URL domain' });
        // }

        const response = await axios({
            method: 'get',
            url: url,
            responseType: 'stream'
        });

        // Set headers
        res.setHeader('Content-Type', response.headers['content-type']);
        // Do not forward Content-Length as axios might decompress the response, making the length incorrect
        // res.setHeader('Content-Length', response.headers['content-length']);

        if (download === 'true' && filename) {
            // Encode filename to handle special characters
            const encodedFilename = encodeURIComponent(filename as string).replace(/['()]/g, escape);
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`);
        } else {
            res.setHeader('Content-Disposition', 'inline');
        }

        // Pipe the file stream to the response
        response.data.pipe(res);

    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: 'Failed to fetch file' });
    }
});

export default router;
