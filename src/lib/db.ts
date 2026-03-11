import { neon } from '@neondatabase/serverless';

const mainUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
const invoiceUrl = process.env.INVOICE_DATABASE_URL || mainUrl;
const quotationUrl = process.env.QUOTATION_DATABASE_URL || mainUrl;

if (!mainUrl) {
    console.warn('⚠️ POSTGRES_URL or DATABASE_URL environment variable is not set! SQL queries will fail.');
}

const createSql = (url: string | undefined, name: string) => {
    if (!url) {
        return ((strings: any, ...values: any[]) => {
            console.warn(`⚠️ ${name} SQL query ignored because Database URL is not set.`);
            return Promise.resolve([]);
        }) as any;
    }
    return neon(url);
};

export const sql = createSql(mainUrl, 'Main');
export const invoiceSql = createSql(invoiceUrl, 'Invoice');
export const quotationSql = createSql(quotationUrl, 'Quotation');

// Export compatibility for any legacy code still using 'query'
export const query = async (text: string, params?: any[]) => {
    // Note: neon doesn't support parameterized queries with $1, $2 in this way directly via its sql tag if passed as values.
    // However, if needed, we can implement a basic wrapper. 
    // Most code uses the sql template literal.
    return { rows: await sql(text, ...(params || [])) };
};


