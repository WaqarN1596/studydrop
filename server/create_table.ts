import pool from './src/db/postgres';

const createTable = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS download_history (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                upload_id INTEGER REFERENCES uploads(id) ON DELETE CASCADE,
                downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Successfully created download_history table');
    } catch (err) {
        console.error('Error creating table:', err);
    } finally {
        await pool.end();
    }
};

createTable();
