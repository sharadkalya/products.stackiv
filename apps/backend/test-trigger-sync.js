/**
 * Test Script 2: Trigger Sync and Monitor Progress
 * 
 * This script manually triggers the sync process and monitors it to completion.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { OdooSyncService } from './src/services/odooSync.service';
import { OdooSyncStatus } from './src/models/odooSyncStatus.model';
import { OdooSyncBatch } from './src/models/odooSyncBatch.model';

dotenv.config();

const USER_ID = 'aYPEyMA39LdyTktykmiQ0mkNh523';

async function getSyncStatus() {
    const status = await OdooSyncStatus.findOne({ userId: USER_ID });
    return status;
}

async function getBatchStats() {
    const batches = await OdooSyncBatch.find({ userId: USER_ID });

    const stats = {
        total: batches.length,
        notStarted: 0,
        inProgress: 0,
        done: 0,
        failed: 0,
        permanentlyFailed: 0,
    };

    batches.forEach((batch) => {
        stats[batch.status === 'not_started' ? 'notStarted' :
            batch.status === 'in_progress' ? 'inProgress' :
                batch.status === 'done' ? 'done' :
                    batch.status === 'failed' ? 'failed' : 'permanentlyFailed']++;
    });

    return stats;
}

async function displayProgress() {
    const status = await getSyncStatus();
    const stats = await getBatchStats();

    console.log('\n📊 Sync Progress:');
    console.log('─'.repeat(60));
    console.log(`Status: ${status?.syncStatus || 'unknown'}`);
    console.log(`\nBatches:`);
    console.log(`  Total: ${stats.total}`);
    console.log(`  ✓ Done: ${stats.done}`);
    console.log(`  ⏳ In Progress: ${stats.inProgress}`);
    console.log(`  ⏸️  Not Started: ${stats.notStarted}`);
    console.log(`  ⚠️  Failed: ${stats.failed}`);
    console.log(`  ❌ Permanently Failed: ${stats.permanentlyFailed}`);
    console.log('─'.repeat(60));

    return stats;
}

async function waitForCompletion(maxWaitSeconds = 300) {
    const startTime = Date.now();
    let lastStats = null;

    console.log(`\n⏳ Waiting for sync to complete (max ${maxWaitSeconds}s)...\n`);

    while (true) {
        const stats = await getBatchStats();
        const elapsed = Math.floor((Date.now() - startTime) / 1000);

        // Check if stats changed
        const statsChanged = JSON.stringify(stats) !== JSON.stringify(lastStats);
        lastStats = stats;

        if (statsChanged) {
            process.stdout.write(`\r[${elapsed}s] Done: ${stats.done}/${stats.total} | In Progress: ${stats.inProgress} | Failed: ${stats.failed}         `);
        }

        // Check if complete
        const pending = stats.notStarted + stats.inProgress + stats.failed;
        if (pending === 0) {
            console.log('\n\n✓ Sync completed!\n');
            break;
        }

        // Check timeout
        if (elapsed > maxWaitSeconds) {
            console.log('\n\n⚠️  Timeout reached. Sync still in progress.\n');
            break;
        }

        // Wait 2 seconds before next check
        await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    await displayProgress();
}

async function main() {
    console.log('\n=== TRIGGER SYNC TEST ===\n');

    try {
        // Connect to MongoDB
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB\n');

        // Check current status
        const currentStatus = await getSyncStatus();
        console.log(`Current sync status: ${currentStatus?.syncStatus || 'No sync status found'}`);

        if (currentStatus?.syncStatus === 'in_progress') {
            console.log('\n⚠️  Sync is already in progress. Monitoring existing sync...');
            await waitForCompletion();
        } else {
            // Clear any existing batches
            const existingBatches = await OdooSyncBatch.countDocuments({ userId: USER_ID });
            if (existingBatches > 0) {
                console.log(`\n🧹 Clearing ${existingBatches} existing batches...`);
                await OdooSyncBatch.deleteMany({ userId: USER_ID });
                console.log('✓ Cleared existing batches\n');
            }

            // Prepare sync
            console.log('🚀 Preparing sync...');
            await OdooSyncService.prepareSync(USER_ID);
            console.log('✓ Sync prepared\n');

            await displayProgress();

            // Process batches
            console.log('\n🔄 Starting batch processing...\n');

            // Process first few batches manually
            let batchCount = 0;
            let hasMore = true;
            while (hasMore && batchCount < 20) {
                hasMore = await OdooSyncService.processNextBatch(USER_ID);
                batchCount++;

                if (batchCount % 5 === 0) {
                    await displayProgress();
                }
            }

            // Wait for completion
            await waitForCompletion(300);
        }

        // Final status
        console.log('\n📋 Final Status:');
        await displayProgress();

        await mongoose.disconnect();
        console.log('\n✓ Test complete!\n');
    } catch (error) {
        console.error('\n❌ Test failed:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

main();
