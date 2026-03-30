import { neon } from '@neondatabase/serverless';

export const mainUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.LOCAL_POSTGRES_URL || process.env.MAIN_POSTGRES_URL;
export const invoiceUrl = process.env.INVOICE_DATABASE_URL || mainUrl;
export const quotationUrl = process.env.QUOTATION_DATABASE_URL || mainUrl;

if (!mainUrl) {
    console.warn('⚠️ No database connection URL found in environment variables (POSTGRES_URL, DATABASE_URL, LOCAL_POSTGRES_URL, MAIN_POSTGRES_URL)! SQL queries will fail.');
}

const createSql = (url: string | undefined, name: string) => {
    if (!url) {
        return ((strings: any, ...values: any[]) => {
            console.warn(`⚠️ ${name} SQL query ignored because Database URL is not set.`);
            return Promise.resolve([]);
        }) as any;
    }
    return (strings: any, ...values: any[]) => {
        return neon(url)(strings, ...values);
    };
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


