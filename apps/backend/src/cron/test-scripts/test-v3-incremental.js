/**
 * Test V3 Incremental Sync Features
 * 
 * This script verifies that v3 fields are set correctly
 * and tests incremental sync behavior
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

import { OdooSyncStatus } from '../../models/odooSyncStatus.model';
import { OdooSyncBatch } from '../../models/odooSyncBatch.model';
import { OdooSyncService } from '../../services/odooSync.service';

dotenv.config();

const USER_ID = 'aYPEyMA39LdyTktykmiQ0mkNh523';

async function verifyV3Fields() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 V3 FIELD VERIFICATION');
    console.log('='.repeat(80) + '\n');

    const syncStatus = await OdooSyncStatus.findOne({ userId: USER_ID });

    if (!syncStatus) {
        console.log('❌ No sync status found');
        return false;
    }

    console.log('Sync Status for user:', USER_ID);
    console.log('─'.repeat(80));
    console.log(`  syncStatus: ${syncStatus.syncStatus}`);
    console.log(`  initialSyncDone: ${syncStatus.initialSyncDone}`);
    console.log(`  hasFailedBatches: ${syncStatus.hasFailedBatches}`);
    console.log(`  lastCompletedWindowEnd: ${syncStatus.lastCompletedWindowEnd?.toISOString() || 'null'}`);
    console.log(`  lastProcessId: ${syncStatus.lastProcessId || 'null'}`);
    console.log('');

    // Verify v3 requirements
    let allGood = true;

    if (!syncStatus.initialSyncDone) {
        console.log('❌ FAIL: initialSyncDone should be true after initial sync');
        allGood = false;
    } else {
        console.log('✅ PASS: initialSyncDone = true');
    }

    if (!syncStatus.lastCompletedWindowEnd) {
        console.log('❌ FAIL: lastCompletedWindowEnd should be set after initial sync');
        allGood = false;
    } else {
        console.log(`✅ PASS: lastCompletedWindowEnd = ${syncStatus.lastCompletedWindowEnd.toISOString()}`);

        // Find the latest batch to compare
        const latestBatch = await OdooSyncBatch.findOne({
            userId: USER_ID,
            status: 'done',
        }).sort({ endTime: -1 }).limit(1);

        if (latestBatch) {
            const matches = syncStatus.lastCompletedWindowEnd.getTime() === latestBatch.endTime.getTime();
            if (matches) {
                console.log('✅ PASS: lastCompletedWindowEnd matches latest batch endTime');
            } else {
                console.log(`⚠️  WARNING: lastCompletedWindowEnd (${syncStatus.lastCompletedWindowEnd.toISOString()}) doesn't match latest batch (${latestBatch.endTime.toISOString()})`);
            }
        }
    }

    if (syncStatus.hasFailedBatches) {
        console.log('⚠️  WARNING: hasFailedBatches = true (there were failures)');
    } else {
        console.log('✅ PASS: hasFailedBatches = false (no failures)');
    }

    console.log('');
    return allGood;
}

async function testIncrementalGeneration() {
    console.log('='.repeat(80));
    console.log('🔄 INCREMENTAL BATCH GENERATION TEST');
    console.log('='.repeat(80) + '\n');

    const syncStatus = await OdooSyncStatus.findOne({ userId: USER_ID });

    if (!syncStatus || !syncStatus.initialSyncDone || !syncStatus.lastCompletedWindowEnd) {
        console.log('❌ Cannot test incremental: initial sync not complete or lastCompletedWindowEnd not set');
        return;
    }

    console.log(`Current lastCompletedWindowEnd: ${syncStatus.lastCompletedWindowEnd.toISOString()}`);

    const now = new Date();
    const windowHours = 24;
    const nextWindowStart = new Date(syncStatus.lastCompletedWindowEnd.getTime() + windowHours * 60 * 60 * 1000);

    console.log(`Next incremental window would start at: ${nextWindowStart.toISOString()}`);
    console.log(`Current time: ${now.toISOString()}`);

    if (now >= nextWindowStart) {
        console.log('✅ Time for incremental sync!');
        console.log('\nGenerating incremental batches...');

        const batchesCreated = await OdooSyncService.generateIncrementalBatches(USER_ID);
        console.log(`Created ${batchesCreated} incremental batches`);

        if (batchesCreated > 0) {
            // Show the new batches
            const newBatches = await OdooSyncBatch.find({
                userId: USER_ID,
                startTime: syncStatus.lastCompletedWindowEnd,
                status: 'not_started',
            });

            console.log('\nNew incremental batches:');
            newBatches.forEach(batch => {
                console.log(`  - ${batch.module}: ${batch.startTime.toISOString()} to ${batch.endTime.toISOString()}`);
            });
        }
    } else {
        const hoursUntilNext = Math.round((nextWindowStart.getTime() - now.getTime()) / (60 * 60 * 1000));
        console.log(`⏱️  Not yet time for incremental sync (${hoursUntilNext} hours remaining)`);
    }

    console.log('');
}

async function main() {
    console.log('\n' + '╔'.repeat(80));
    console.log('║ V3 INCREMENTAL SYNC VERIFICATION');
    console.log('╚'.repeat(80) + '\n');

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB\n');

        // Verify v3 fields
        const fieldsOk = await verifyV3Fields();

        // Test incremental generation
        await testIncrementalGeneration();

        await mongoose.disconnect();

        if (fieldsOk) {
            console.log('✅ All v3 verifications passed!\n');
            process.exit(0);
        } else {
            console.log('❌ Some v3 verifications failed\n');
            process.exit(1);
        }
    } catch (error) {
        console.error('\n❌ Test failed:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

main();
