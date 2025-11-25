import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { OdooSyncService } from './src/services/odooSync.service';

dotenv.config();

const USER_ID = 'aYPEyMA39LdyTktykmiQ0mkNh523';

async function manualProcess() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    console.log('Processing remaining batches...\n');

    for (let i = 0; i < 10; i++) {
        try {
            const hasMore = await OdooSyncService.processNextBatch(USER_ID);
            console.log(`\nBatch ${i + 1}: ${hasMore ? '✓ processed' : 'no more batches'}`);

            if (!hasMore) {
                console.log('\n✓ All batches processed!');
                break;
            }

            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
            console.error(`\n❌ Error on batch ${i + 1}:`, error.message);
            break;
        }
    }

    await mongoose.disconnect();
    console.log('\n✓ Done');
}

manualProcess().catch(console.error);
