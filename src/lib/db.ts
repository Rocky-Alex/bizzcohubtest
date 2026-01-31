import { neon } from '@neondatabase/serverless';

// Dynamic client to handle environment variable loading/reloading
export const sql = (strings: TemplateStringsArray | string[], ...values: any[]) => {
    const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;

    if (!databaseUrl) {
        console.warn('⚠️ POSTGRES_URL or DATABASE_URL environment variable is not set! SQL queries will fail.');
        return Promise.resolve([]);
    }

    // Instantiate neon client on the fly (lightweight for serverless driver)
    const masked = databaseUrl.replace(/:[^:]*@/, ':***@');
    console.log('🔌 DB Connect:', masked);
    const sqlClient = neon(databaseUrl);

    // @ts-ignore - The neon types are complex, proxying the call
    return sqlClient(strings, ...values);
};

// Helper for raw queries (BE CAREFUL: SQL INJECTION RISK)
export const unsafe = (query: string) => {
    const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error('Database URL not set');

    const sqlClient = neon(databaseUrl);
    const templateArr = [query];
    // @ts-ignore
    templateArr.raw = [query];
    // @ts-ignore
    return sqlClient(templateArr);
};
