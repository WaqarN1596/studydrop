import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });
import { queryAll } from '../src/db/postgres';

async function checkUploads() {
    try {
        const uploads = await queryAll('SELECT id, title, file_path FROM uploads LIMIT 10');
        console.log('Uploads:', JSON.stringify(uploads, null, 2));
    } catch (e) {
        console.error(e);
    }
}

checkUploads();
