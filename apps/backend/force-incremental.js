import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const USER_ID = 'aYPEyMA39LdyTktykmiQ0mkNh523';

async function forceIncrementalSync() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Get current sync status
    const syncStatus = await mongoose.connection.db.collection('odoosyncstatuses').findOne({ userId: USER_ID });
    
    if (!syncStatus) {
        console.log('❌ No sync status found');
        process.exit(1);
    }

    console.log('Current sync status:');
    console.log(`  initialSyncDone: ${syncStatus.initialSyncDone}`);
    console.log(`  lastCompletedWindowEnd: ${syncStatus.lastCompletedWindowEnd?.toISOString()}`);
    console.log('');

    if (!syncStatus.initialSyncDone || !syncStatus.lastCompletedWindowEnd) {
        console.log('❌ Cannot force incremental: initial sync not complete');
        process.exit(1);
    }

    // Set lastCompletedWindowEnd to 25+ hours ago to trigger incremental sync
    const now = new Date();
    const forcedWindowEnd = new Date(now.getTime() - 26 * 60 * 60 * 1000); // 26 hours ago

    await mongoose.connection.db.collection('odoosyncstatuses').updateOne(
        { userId: USER_ID },
        { $set: { lastCompletedWindowEnd: forcedWindowEnd } }
    );

    console.log(`✅ Updated lastCompletedWindowEnd to: ${forcedWindowEnd.toISOString()}`);
    console.log(`   (26 hours ago, triggering incremental sync)`);
    console.log('');
    console.log('✅ Next cron run will generate incremental batches!');
    console.log('   Or run: npm run test:manual to process batches manually');

    await mongoose.disconnect();
}

forceIncrementalSync().catch(console.error);
