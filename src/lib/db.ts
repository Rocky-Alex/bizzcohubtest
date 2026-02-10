import { Pool } from 'pg';

const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
    console.warn('⚠️ POSTGRES_URL or DATABASE_URL environment variable is not set! SQL queries will fail.');
}

// Global object to cache the pool in development to avoid exhausting connections
const globalForDb = global as unknown as { pool: Pool };

export const pool = globalForDb.pool || new Pool({
    connectionString: databaseUrl,
});

if (process.env.NODE_ENV !== 'production') globalForDb.pool = pool;

// Compatibility wrapper to match neon's sql`...` signature
// Neon returns Promise<Row[]> directly. pg.query returns Result { rows: [] }
export const sql = async (strings: TemplateStringsArray | string, ...values: any[]) => {
    if (!databaseUrl) {
        console.warn('⚠️ SQL query ignored because Database URL is not set.');
        return [];
    }

    try {
        // Handle template literal vs string usage if any
        let queryText = '';
        if (typeof strings === 'string') {
            queryText = strings;
        } else {
            // Reconstruct the query string from template parts
            // We need to use parameterized queries ($1, $2, etc.) for safety.
            // The `neon` driver might have handled this differently (client-side interpolation or similar),
            // but `pg` requires $1, $2.
            // However, the existing code likely uses ${value} interpolation which the Tagged Template Literal receives.
            // The Neon driver `sql` function handles parameterization automatically.
            // We need to convert the template literal parts and values into a parameterized query.

            // Example: sql`SELECT * FROM users WHERE id = ${userId}`
            // strings: ["SELECT * FROM users WHERE id = ", ""]
            // values: [userId]
            // Output needed: "SELECT * FROM users WHERE id = $1", [userId]

            queryText = strings.reduce((acc, curr, i) => {
                const paramIndex = i < values.length ? `$${i + 1}` : '';
                return acc + curr + paramIndex;
            }, '');
        }

        const result = await pool.query(queryText, values);
        return result.rows;

    } catch (error) {
        console.error('Database Query Error:', error);
        throw error;
    }
};

// Also export a helper for raw query text if needed elsewhere
export const query = (text: string, params?: any[]) => pool.query(text, params);

