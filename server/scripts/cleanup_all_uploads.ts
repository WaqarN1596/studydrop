import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function cleanupAllUploads() {
    try {
        console.log('🗑️  Cleaning up all uploads...');

        // Delete all upload tags first (foreign key constraint)
        const tagsResult = await pool.query('DELETE FROM upload_tags');
        console.log(`✅ Deleted ${tagsResult.rowCount} upload tags`);

        // Check if downloads table exists and delete if it does
        try {
            const downloadsResult = await pool.query('DELETE FROM downloads');
            console.log(`✅ Deleted ${downloadsResult.rowCount} download records`);
        } catch (err: any) {
            if (err.code !== '42P01') { // Ignore "relation does not exist" error
                throw err;
            }
            console.log('ℹ️  Downloads table does not exist, skipping');
        }

        // Delete all uploads
        const uploadsResult = await pool.query('DELETE FROM uploads');
        console.log(`✅ Deleted ${uploadsResult.rowCount} uploads`);

        console.log('✨ All uploads cleaned successfully!');
    } catch (error) {
        console.error('❌ Error cleaning uploads:', error);
    } finally {
        await pool.end();
    }
}

cleanupAllUploads();
