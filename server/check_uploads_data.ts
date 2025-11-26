import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env') });

import { queryAll } from './src/db/postgres';

async function checkData() {
    console.log('Checking uploads data for user 6...\n');

    const uploads = await queryAll(
        `SELECT 
            id,
            title,
            original_filename,
            file_path,
            mime_type,
            created_at,
            class_id
         FROM uploads 
         WHERE user_id = $1 
         LIMIT 3`,
        [6]
    );

    console.log(`Found ${uploads.length} uploads:\n`);

    uploads.forEach((upload, idx) => {
        console.log(`Upload #${idx + 1}:`);
        console.log(`  ID: ${upload.id}`);
        console.log(`  Title: ${upload.title}`);
        console.log(`  Filename: ${upload.original_filename}`);
        console.log(`  File Path: ${upload.file_path}`);
        console.log(`  MIME Type: ${upload.mime_type}`);
        console.log(`  Created At: ${upload.created_at}`);
        console.log(`  Class ID: ${upload.class_id}`);
        console.log('');
    });

    process.exit(0);
}

checkData().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
