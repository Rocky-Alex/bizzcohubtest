import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Check environment variables
        const hasPostgresUrl = !!process.env.POSTGRES_URL;
        const hasDatabaseUrl = !!process.env.DATABASE_URL;

        // Try to import and test database connection
        let dbConnectionTest = 'Not tested';
        let dbError = null;

        try {
            const { sql } = await import('@/lib/db');
            // Try a simple query
            const result = await sql`SELECT 1 as test`;
            dbConnectionTest = 'Success';
        } catch (error: any) {
            dbConnectionTest = 'Failed';
            dbError = {
                message: error.message,
                code: error.code,
                name: error.name
            };
        }

        return NextResponse.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV,
            environmentVariables: {
                POSTGRES_URL: hasPostgresUrl ? 'Set' : 'Not set',
                DATABASE_URL: hasDatabaseUrl ? 'Set' : 'Not set',
            },
            databaseConnection: {
                status: dbConnectionTest,
                error: dbError
            }
        });
    } catch (error: any) {
        return NextResponse.json({
            status: 'error',
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
