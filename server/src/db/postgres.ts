import { Pool, QueryResult } from 'pg';

// PostgreSQL connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Test connection on startup
pool.on('connect', () => {
    console.log('✅ PostgreSQL connected successfully');
});

pool.on('error', (err) => {
    console.error('❌ Unexpected PostgreSQL error:', err);
});

// Helper function to run queries
export const query = async (text: string, params?: any[]): Promise<QueryResult> => {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log(`Query executed in ${duration}ms:`, text.substring(0, 100));
        return result;
    } catch (error) {
        console.error('Query error:', error);
        throw error;
    }
};

// Helper to get single row
export const queryOne = async (text: string, params?: any[]): Promise<any | null> => {
    const result = await query(text, params);
    return result.rows[0] || null;
};

// Helper to get all rows
export const queryAll = async (text: string, params?: any[]): Promise<any[]> => {
    const result = await query(text, params);
    return result.rows;
};

// Helper for transactions
export const transaction = async (callback: (client: any) => Promise<void>) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await callback(client);
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

// Close pool (for graceful shutdown)
export const closePool = async () => {
    await pool.end();
    console.log('PostgreSQL pool closed');
};

export default pool;
