import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from server/.env
dotenv.config({ path: path.join(__dirname, '../.env') });
console.log('DATABASE_URL present:', !!process.env.DATABASE_URL);
console.log('GOOGLE_AI_API_KEY present:', !!process.env.GOOGLE_AI_API_KEY);

import { chatWithDocument } from '../src/controllers/aiController';
import pool from '../src/db/postgres';

const mockResponse = () => {
    const res: any = {};
    res.status = (code: number) => {
        console.log(`[Response Status]: ${code}`);
        return res;
    };
    res.json = (data: any) => {
        console.log('[Response JSON]:', JSON.stringify(data, null, 2));
        return res;
    };
    return res;
};

const runTest = async () => {
    try {
        console.log('Testing AI Chat Feature...');

        // 1. Get a valid upload
        const result = await pool.query('SELECT id, title, original_filename FROM uploads LIMIT 1');

        if (result.rows.length === 0) {
            console.log('No uploads found in database to test with.');
            return;
        }

        const upload = result.rows[0];
        console.log(`Testing with Upload ID: ${upload.id} (${upload.title || upload.original_filename})`);

        // 2. Mock Request
        const req: any = {
            user: { id: 1 }, // Assuming user ID 1 exists or is not strictly checked for ownership in this specific controller logic (it checks auth middleware usually, but here we call controller directly)
            body: {
                uploadId: upload.id,
                message: "What is this document about? Please summarize it briefly.",
                messages: []
            }
        };

        // 3. Call Controller
        await chatWithDocument(req, mockResponse());

    } catch (error) {
        console.error('Test Failed:', error);
    } finally {
        await pool.end();
    }
};

runTest();
