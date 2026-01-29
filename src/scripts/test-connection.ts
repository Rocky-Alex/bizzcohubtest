import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
    const url = process.env.DATABASE_URL;
    const pgUrl = process.env.POSTGRES_URL;

    console.log('Env keys:', Object.keys(process.env).filter(k => !k.startsWith('npm_')));

    if (url) {
        console.log('✅ DATABASE_URL is defined');
    } else {
        console.log('❌ DATABASE_URL is undefined');
    }

    if (pgUrl) {
        console.log('✅ POSTGRES_URL is defined');
    } else {
        console.log('❌ POSTGRES_URL is undefined');
    }
}

main();
