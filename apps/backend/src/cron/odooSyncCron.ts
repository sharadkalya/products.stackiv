import path from 'path';

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import * as cron from 'node-cron';

import { SYNC_CONFIG } from '@/config/sync.config';
import { OdooSyncStatus } from '@/models/odooSyncStatus.model';
import { OdooSyncService } from '@/services/odooSync.service';

// Load environment variables from backend root directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

/**
 * Odoo Sync Cron Job
 * 
 * Runs periodically to process sync batches for all users
 */

let isRunning = false;
let cycleCount = 0;

async function runSyncCycle() {
    if (isRunning) {
        console.log('[OdooSyncCron] Previous cycle still running, skipping...');
        return;
    }

    isRunning = true;
    cycleCount++;

    try {
        console.log(`\n[OdooSyncCron] === Cycle #${cycleCount} starting ===`);

        // v3: Case A - Find users that need initial sync preparation
        const usersNeedingPrep = await OdooSyncStatus.find({
            connectionInfoAvailable: true,
            syncStatus: { $in: ['not_started', 'pending', 'failed'] },
            initialSyncDone: false, // Only users who haven't completed initial sync
        });

        console.log(`[OdooSyncCron] Users needing initial sync prep: ${usersNeedingPrep.length}`);

        for (const userStatus of usersNeedingPrep) {
            try {
                console.log(`[OdooSyncCron] Preparing initial sync for user ${userStatus.userId} (status: ${userStatus.syncStatus})...`);
                await OdooSyncService.prepareSync(userStatus.userId);
            } catch (error) {
                console.error(
                    `[OdooSyncCron] Failed to prepare sync for user ${userStatus.userId}:`,
                    error,
                );
            }
        }

        // v3: Case B - Generate incremental batches for users who completed initial sync
        const usersForIncremental = await OdooSyncStatus.find({
            connectionInfoAvailable: true,
            initialSyncDone: true,
            syncStatus: { $in: ['done', 'in_progress'] }, // Users with completed or ongoing sync
        });

        console.log(`[OdooSyncCron] Users ready for incremental sync: ${usersForIncremental.length}`);

        for (const userStatus of usersForIncremental) {
            try {
                const batchesCreated = await OdooSyncService.generateIncrementalBatches(userStatus.userId);
                if (batchesCreated > 0) {
                    console.log(`[OdooSyncCron] Generated ${batchesCreated} incremental batches for user ${userStatus.userId}`);
                }
            } catch (error) {
                console.error(
                    `[OdooSyncCron] Failed to generate incremental batches for user ${userStatus.userId}:`,
                    error,
                );
            }
        }

        // Find users with in-progress syncs (both initial and incremental)
        const usersInProgress = await OdooSyncStatus.find({
            syncStatus: 'in_progress',
        });

        console.log(`[OdooSyncCron] Users in progress: ${usersInProgress.length}`);

        // Process batches in parallel with concurrency control from config
        const CONCURRENT_LIMIT = SYNC_CONFIG.CONCURRENT_USER_LIMIT;

        for (let i = 0; i < usersInProgress.length; i += CONCURRENT_LIMIT) {
            const userBatch = usersInProgress.slice(i, i + CONCURRENT_LIMIT);
            const batchNumber = Math.floor(i / CONCURRENT_LIMIT) + 1;
            const totalBatches = Math.ceil(usersInProgress.length / CONCURRENT_LIMIT);

            console.log(`[OdooSyncCron] Processing user batch ${batchNumber}/${totalBatches} (${userBatch.length} users concurrently)`);

            await Promise.all(
                userBatch.map(async (userStatus) => {
                    try {
                        console.log(`[OdooSyncCron] Processing batch for user ${userStatus.userId}...`);
                        const processed = await OdooSyncService.processNextBatch(userStatus.userId);
                        if (!processed) {
                            console.log(`[OdooSyncCron] No more batches for user ${userStatus.userId}`);
                        }
                    } catch (error) {
                        console.error(
                            `[OdooSyncCron] Failed to process batch for user ${userStatus.userId}:`,
                            error,
                        );
                    }
                }),
            );
        }

        console.log(`[OdooSyncCron] === Cycle #${cycleCount} complete ===\n`);
    } catch (error) {
        console.error('[OdooSyncCron] Error in sync cycle:', error);
    } finally {
        isRunning = false;
    }
}

async function connectToDatabase() {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        throw new Error('MONGODB_URI environment variable is not set');
    }

    await mongoose.connect(mongoUri);
    console.log('[OdooSyncCron] Connected to MongoDB');
}

async function startCron() {
    try {
        // Connect to database
        await connectToDatabase();

        console.log(`[OdooSyncCron] Starting cron with schedule: ${SYNC_CONFIG.CRON_SCHEDULE}`);

        // Schedule the cron job
        cron.schedule(SYNC_CONFIG.CRON_SCHEDULE, async () => {
            await runSyncCycle();
        });

        console.log('[OdooSyncCron] Cron job scheduled successfully');
    } catch (error) {
        console.error('[OdooSyncCron] Failed to start cron:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('[OdooSyncCron] Shutting down...');
    await mongoose.connection.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('[OdooSyncCron] Shutting down...');
    await mongoose.connection.close();
    process.exit(0);
});

// Start the cron
startCron();
