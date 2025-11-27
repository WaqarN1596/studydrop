import { query, closePool } from '../src/db/postgres';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const runMigration = async () => {
    try {
        const migrationPath = path.join(__dirname, '../migrations/add_chat_tables.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log('Running migration...');
        await query(sql);
        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await closePool();
    }
};

runMigration();
