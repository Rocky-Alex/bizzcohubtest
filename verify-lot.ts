import 'dotenv/config';
import { db } from './src/db/index';  // Updated path
import { purchaseLots } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
    console.log('--- Verifying Purchase Lots ---');
    try {
        const allLots = await db.query.purchaseLots.findMany();
        console.log(`Total Lots found: ${allLots.length}`);
        console.log('Lot IDs present:', allLots.map(l => l.lotId));

        const targetId = 4;
        console.log(`Attempting to fetch Lot ID ${targetId} with items...`);
        const lot = await db.query.purchaseLots.findFirst({
            where: eq(purchaseLots.lotId, targetId),
            with: {
                items: true
            }
        });

        if (lot) {
            console.log('✅ Lot found!');
            console.log('Lot Number:', lot.lotNumber);
            console.log('Item Count:', lot.items.length);
            console.log('Total Cost:', lot.totalCost);
        } else {
            console.log('❌ Lot NOT found (returned null).');
        }

    } catch (error) {
        console.error('Error during verification:', error);
    }
}

main();
