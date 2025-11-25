import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function applySchema() {
    try {
        // Correct path: ../database-schema.sql relative to server/scripts/
        const schemaPath = path.resolve(__dirname, '../database-schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Applying schema from:', schemaPath);
        await pool.query(schemaSql);
        console.log('Schema applied successfully!');
    } catch (error) {
        console.error('Error applying schema:', error);
    } finally {
        await pool.end();
    }
}

applySchema();
