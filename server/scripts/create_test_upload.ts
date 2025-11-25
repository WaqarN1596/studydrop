import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });
import { queryOne } from '../src/db/postgres';

async function createTestUpload() {
    try {
        console.log('Creating test upload...');
        // Find a user and class
        const user = await queryOne('SELECT id FROM users LIMIT 1');
        const cls = await queryOne('SELECT id FROM classes LIMIT 1');

        if (!user || !cls) {
            console.error('No user or class found to attach upload to.');
            return;
        }

        const result = await queryOne(
            `INSERT INTO uploads (
                user_id, class_id, title, summary, 
                file_path, mime_type, original_filename, file_size, category
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
            [
                user.id,
                cls.id,
                'Test Public PDF',
                'A sample PDF to verify the viewer',
                'https://pdfobject.com/pdf/sample.pdf',
                'application/pdf',
                'sample.pdf',
                1024,
                'notes'
            ]
        );

        console.log('✅ Created test upload with ID:', result.id);
    } catch (e) {
        console.error('Error creating test upload:', e);
    }
}

createTestUpload();
