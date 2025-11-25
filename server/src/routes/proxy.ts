import express, { Request, Response } from 'express';
import axios from 'axios';

const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
    try {
        const { url, filename, download } = req.query;

        if (!url || typeof url !== 'string') {
            return res.status(400).json({ error: 'URL is required' });
        }

        // Fetch the file from the URL
        const response = await axios({
            method: 'get',
            url: url as string,
            responseType: 'stream'
        });

        // Set clean headers
        res.setHeader('Content-Type', response.headers['content-type']);

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
