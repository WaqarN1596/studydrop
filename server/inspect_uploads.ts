import { queryAll } from './src/db/postgres';

async function inspectUploads() {
    try {
        const uploads = await queryAll(`
            SELECT id, title, original_filename, mime_type, file_path, created_at 
            FROM uploads 
            ORDER BY created_at DESC 
            LIMIT 5
        `);
        console.log(JSON.stringify(uploads, null, 2));
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

inspectUploads();
