import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });
import { query } from '../src/db/postgres';

async function cleanupLegacyUploads() {
    try {
        console.log('Deleting broken legacy uploads (IDs 1-4)...');
        await query('DELETE FROM uploads WHERE id IN (1, 2, 3, 4)');
        console.log('✅ Deleted broken uploads.');
    } catch (e) {
        console.error('Error deleting uploads:', e);
    }
}

cleanupLegacyUploads();
