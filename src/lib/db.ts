import { neon } from '@neondatabase/serverless';

const isVercel = process.env.VERCEL === '1' || process.env.NEXT_PUBLIC_VERCEL_ENV !== undefined;
const isNetlify = process.env.NETLIFY === 'true';

// Priority:
// 1. If on Vercel, use VERCEL_DATABASE_URL
// 2. If on Netlify or Local, use LOCAL_DATABASE_URL
// 3. Fallback to standard environment variables
export const mainUrl = isVercel
    ? (process.env.VERCEL_DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL)
    : (process.env.LOCAL_DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL);

export const invoiceUrl = process.env.INVOICE_DATABASE_URL || mainUrl;
export const quotationUrl = process.env.QUOTATION_DATABASE_URL || mainUrl;

if (!mainUrl) {
    console.warn('⚠️ No database connection URL found! Current Platform:', isVercel ? 'Vercel' : (isNetlify ? 'Netlify' : 'Local/Other'));
}

// Define a global type to persist connections during dev hot-reloads
const globalForDb = global as unknown as {
    sqlHandlers: Record<string, any>;
};

if (!globalForDb.sqlHandlers) {
    globalForDb.sqlHandlers = {};
}

const createSql = (url: string | undefined, name: string) => {
    if (globalForDb.sqlHandlers[name]) {
        return globalForDb.sqlHandlers[name];
    }

    const maskedUrl = url ? url.replace(/:[^:@/]+@/, ':***@') : 'UNDEFINED';
    console.log(`[DB] initializing ${name} with URL: ${maskedUrl}`);

    if (!url) {
        const fallback = ((strings: any, ...values: any[]) => {
            console.warn(`⚠️ ${name} SQL query ignored because Database URL is not set.`);
            return Promise.resolve([]);
        }) as any;
        globalForDb.sqlHandlers[name] = fallback;
        return fallback;
    }

    const neonHandler = neon(url);
    const wrapper = (strings: any, ...values: any[]) => {
        if (typeof strings === 'string') {
            return (neonHandler as any).query(strings, values);
        }
        return neonHandler(strings, ...values);
    };

    globalForDb.sqlHandlers[name] = wrapper;
    return wrapper;
};

export const sql = createSql(mainUrl, 'Main');
export const invoiceSql = createSql(invoiceUrl, 'Invoice');
export const quotationSql = createSql(quotationUrl, 'Quotation');

// Export compatibility for any legacy code still using 'query'
export const query = async (text: string, params?: any[]) => {
    // Note: Use the safely wrapped sql as a function here
    const results = await sql(text, ...(params || []));
    return { rows: results };
};


