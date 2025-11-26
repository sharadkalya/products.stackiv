import { SYNC_CONFIG, MODULE_DISPLAY_NAMES } from '@/config/sync.config';
import { OdooConnectionDetails } from '@/models/odoo.model';
import { OdooSyncBatch, BatchStatus } from '@/models/odooSyncBatch.model';
import { OdooSyncStatus } from '@/models/odooSyncStatus.model';
import { ModuleDataWriterService } from '@/services/moduleDataWriter.service';
import { OdooClientService, OdooConnection } from '@/services/odooClient.service';
import { addDays, addHours } from '@/utils/time';

/**
 * Odoo Sync Service
 * 
 * Core sync pipeline that manages the lifecycle of syncing Odoo data
 */
export class OdooSyncService {
    /**
     * Prepare sync for a user
     * - Tests connection
     * - Detects installed modules
     * - Creates initial batches
     * - Updates sync status to "in_progress"
     */
    static async prepareSync(userId: string): Promise<void> {
        console.log(`[OdooSync] Preparing sync for user ${userId}`);

        try {
            // Get connection details
            const connectionDetails = await OdooConnectionDetails.findOne({ userId });
            if (!connectionDetails) {
                throw new Error('No connection details found');
            }

            const conn: OdooConnection = {
                odooUrl: connectionDetails.odooUrl,
                dbName: connectionDetails.dbName,
                username: connectionDetails.username,
                password: connectionDetails.password,
            };

            // Test connection
            const testResult = await OdooClientService.testConnection(conn);
            if (!testResult.success) {
                throw new Error(`Connection test failed: ${testResult.message}`);
            }

            // Note: We skip checking installed modules because Odoo modules != models
            // Instead, we'll try to sync all supported models and handle errors gracefully
            console.log(
                `[OdooSync] Will attempt to sync ${SYNC_CONFIG.SUPPORTED_MODULES.length} models: ${SYNC_CONFIG.SUPPORTED_MODULES.join(', ')}`,
            );

            // Create initial batches for each module
            const now = new Date();
            const initialStartTime = addDays(now, -SYNC_CONFIG.INITIAL_SYNC_RANGE_DAYS);

            for (const odooModule of SYNC_CONFIG.SUPPORTED_MODULES) {
                const initialEndTime = addHours(initialStartTime, SYNC_CONFIG.WINDOW_HOURS);

                await OdooSyncBatch.create({
                    userId,
                    module: odooModule,
                    startTime: initialStartTime,
                    endTime: initialEndTime,
                    status: 'not_started',
                    attempts: 0,
                });

                console.log(
                    `[OdooSync] Created initial batch for ${MODULE_DISPLAY_NAMES[odooModule]}`,
                );
            }

            // Update sync status
            await OdooSyncStatus.findOneAndUpdate(
                { userId },
                {
                    syncStatus: 'in_progress',
                    lastSyncStartedAt: new Date(),
                },
            );

            console.log(`[OdooSync] Sync preparation complete for user ${userId}`);
        } catch (error) {
            console.error(`[OdooSync] Failed to prepare sync for user ${userId}:`, error);

            // Update sync status to failed
            await OdooSyncStatus.findOneAndUpdate(
                { userId },
                {
                    syncStatus: 'failed',
                    lastSyncFailedAt: new Date(),
                },
            );

            throw error;
        }
    }

    /**
     * Process the next batch for a user (v2)
     * - Finds next eligible batch
     * - Uses fetchAllRecordsForWindow with ID-based pagination
     * - Implements all-or-nothing batch processing
     * - Creates next batch if needed
     */
    static async processNextBatch(userId: string): Promise<boolean> {
        try {
            // Reset any batches that have been in_progress for too long (likely from a crash)
            const staleThreshold = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
            await OdooSyncBatch.updateMany(
                {
                    userId,
                    status: 'in_progress',
                    updatedAt: { $lt: staleThreshold },
                },
                {
                    $set: { status: 'failed' },
                },
            );

            // Find next batch to process
            const batch = await OdooSyncBatch.findOne({
                userId,
                status: { $in: ['not_started', 'failed'] as BatchStatus[] },
                attempts: { $lt: SYNC_CONFIG.MAX_BATCH_ATTEMPTS },
            })
                .sort({ startTime: 1 })
                .limit(1);

            if (!batch) {
                // No more batches to process, check if sync is complete
                await this.checkSyncCompletion(userId);
                return false;
            }

            console.log(
                `[OdooSync] Processing batch for user ${userId}, module ${batch.module}, window ${batch.startTime.toISOString()} to ${batch.endTime.toISOString()}`,
            );

            // Mark batch as in progress (lock)
            batch.status = 'in_progress';
            batch.attempts += 1;
            await batch.save();

            // Get connection details
            const connectionDetails = await OdooConnectionDetails.findOne({ userId });
            if (!connectionDetails) {
                throw new Error('No connection details found');
            }

            const conn: OdooConnection = {
                odooUrl: connectionDetails.odooUrl,
                dbName: connectionDetails.dbName,
                username: connectionDetails.username,
                password: connectionDetails.password,
            };

            // v2: Use ID-based pagination to fetch ALL records in the fixed window
            // This never fails due to density and handles CSV imports correctly
            const allRecords = await OdooClientService.fetchAllRecordsForWindow(
                conn,
                batch.module,
                batch.startTime,
                batch.endTime,
            );

            console.log(
                `[OdooSync] Fetched ${allRecords.length} records for ${MODULE_DISPLAY_NAMES[batch.module]} using ID-based pagination`,
            );

            // If no records in this window, mark as done and create next batch immediately
            if (allRecords.length === 0) {
                batch.status = 'done';
                batch.recordCountExpected = 0;
                await batch.save();

                console.log(
                    `[OdooSync] No records in window for ${MODULE_DISPLAY_NAMES[batch.module]}, moving to next window`,
                );

                // Create next batch if there's more data to sync
                const now = new Date();
                if (batch.endTime < now) {
                    const nextStartTime = batch.endTime;
                    const nextEndTime = addHours(nextStartTime, SYNC_CONFIG.WINDOW_HOURS);

                    await OdooSyncBatch.create({
                        userId,
                        module: batch.module,
                        startTime: nextStartTime,
                        endTime: nextEndTime,
                        status: 'not_started',
                        attempts: 0,
                    });

                    console.log(
                        `[OdooSync] Created next batch for ${MODULE_DISPLAY_NAMES[batch.module]}`,
                    );
                } else {
                    // No more batches to create, check if sync is complete
                    await this.checkSyncCompletion(userId);
                }

                return true;
            }

            // v2: All-or-nothing write
            // If this fails, we discard all records and mark batch as failed
            // The upsert strategy ensures no duplicates on retry
            await ModuleDataWriterService.upsertRecords(userId, batch.module, allRecords);

            console.log(
                `[OdooSync] Successfully wrote ${allRecords.length} records for ${MODULE_DISPLAY_NAMES[batch.module]}`,
            );

            // Mark batch as done
            batch.status = 'done';
            batch.recordCountExpected = allRecords.length;
            await batch.save();

            // v3: Update lastCompletedWindowEnd for incremental sync
            await this.updateLastCompletedWindow(userId, batch.endTime);

            // Create next batch if there's more data to sync
            const now = new Date();
            if (batch.endTime < now) {
                const nextStartTime = batch.endTime;
                const nextEndTime = addHours(nextStartTime, SYNC_CONFIG.WINDOW_HOURS);

                await OdooSyncBatch.create({
                    userId,
                    module: batch.module,
                    startTime: nextStartTime,
                    endTime: nextEndTime,
                    status: 'not_started',
                    attempts: 0,
                });

                console.log(
                    `[OdooSync] Created next batch for ${MODULE_DISPLAY_NAMES[batch.module]}`,
                );
            } else {
                // No more batches to create, check if sync is complete
                await this.checkSyncCompletion(userId);
            }

            return true;
        } catch (error) {
            console.error(`[OdooSync] Error processing batch for user ${userId}:`, error);

            // v2: All-or-nothing - on error, discard all fetched data
            // Update batch with error
            const batch = await OdooSyncBatch.findOne({
                userId,
                status: 'in_progress',
            }).sort({ updatedAt: -1 });

            if (batch) {
                if (batch.attempts >= SYNC_CONFIG.MAX_BATCH_ATTEMPTS) {
                    batch.status = 'permanently_failed';
                } else {
                    batch.status = 'failed';
                }
                batch.lastError = error instanceof Error ? error.message : 'Unknown error';
                await batch.save();

                // v3: Set hasFailedBatches flag
                await OdooSyncStatus.findOneAndUpdate(
                    { userId },
                    {
                        hasFailedBatches: true,
                        lastSyncFailedAt: new Date(),
                    },
                );
            }

            return false;
        }
    }

    /**
     * Check if all batches are complete and update sync status (v3)
     * 
     * When initial sync completes:
     * - Sets initialSyncDone = true
     * - Sets lastCompletedWindowEnd to the latest batch endTime
     */
    private static async checkSyncCompletion(userId: string): Promise<void> {
        const pendingBatches = await OdooSyncBatch.countDocuments({
            userId,
            status: { $in: ['not_started', 'in_progress', 'failed'] as BatchStatus[] },
            attempts: { $lt: SYNC_CONFIG.MAX_BATCH_ATTEMPTS },
        });

        console.log(`[OdooSync] Checking sync completion for user ${userId}: ${pendingBatches} pending batches`);

        if (pendingBatches > 0) {
            // Log details of pending batches for debugging
            const batches = await OdooSyncBatch.find({
                userId,
                status: { $in: ['not_started', 'in_progress', 'failed'] as BatchStatus[] },
                attempts: { $lt: SYNC_CONFIG.MAX_BATCH_ATTEMPTS },
            }).limit(5);

            batches.forEach(b => {
                console.log(`  - ${b.module}: ${b.status}, attempts: ${b.attempts}, window: ${b.startTime.toISOString()} to ${b.endTime.toISOString()}`);
            });
        }

        if (pendingBatches === 0) {
            // All batches are either done or permanently failed
            console.log(`[OdooSync] Sync complete for user ${userId}`);

            // v3: Check if this is initial sync completion
            const syncStatus = await OdooSyncStatus.findOne({ userId });
            if (syncStatus && !syncStatus.initialSyncDone) {
                // Find the latest batch endTime to set as lastCompletedWindowEnd
                const latestBatch = await OdooSyncBatch.findOne({
                    userId,
                    status: 'done',
                })
                    .sort({ endTime: -1 })
                    .limit(1);

                const updateFields: any = {
                    syncStatus: 'done',
                    lastSyncCompletedAt: new Date(),
                    initialSyncDone: true,
                };

                if (latestBatch) {
                    updateFields.lastCompletedWindowEnd = latestBatch.endTime;
                    console.log(
                        `[OdooSync] Initial sync complete for user ${userId}. lastCompletedWindowEnd set to ${latestBatch.endTime.toISOString()}`,
                    );
                }

                await OdooSyncStatus.findOneAndUpdate({ userId }, updateFields);
            } else {
            // This is an incremental sync completion
                await OdooSyncStatus.findOneAndUpdate(
                    { userId },
                    {
                        syncStatus: 'done',
                        lastSyncCompletedAt: new Date(),
                    },
                );
            }
        }
    }

    /**
     * Get sync progress for a user
     */
    static async getSyncProgress(userId: string): Promise<{
        totalBatches: number;
        completedBatches: number;
        failedBatches: number;
        pendingBatches: number;
        progressPercentage: number;
    }> {
        const totalBatches = await OdooSyncBatch.countDocuments({ userId });
        const completedBatches = await OdooSyncBatch.countDocuments({
            userId,
            status: 'done',
        });
        const failedBatches = await OdooSyncBatch.countDocuments({
            userId,
            status: 'permanently_failed',
        });
        const pendingBatches = await OdooSyncBatch.countDocuments({
            userId,
            status: { $in: ['not_started', 'in_progress', 'failed'] as BatchStatus[] },
        });

        const progressPercentage = totalBatches > 0
            ? Math.round((completedBatches / totalBatches) * 100)
            : 0;

        return {
            totalBatches,
            completedBatches,
            failedBatches,
            pendingBatches,
            progressPercentage,
        };
    }

    /**
     * v3: Update lastCompletedWindowEnd when a batch completes successfully
     */
    private static async updateLastCompletedWindow(userId: string, windowEndTime: Date): Promise<void> {
        const syncStatus = await OdooSyncStatus.findOne({ userId });

        // Only update if this window end is later than current lastCompletedWindowEnd
        if (!syncStatus?.lastCompletedWindowEnd || windowEndTime > syncStatus.lastCompletedWindowEnd) {
            await OdooSyncStatus.findOneAndUpdate(
                { userId },
                { lastCompletedWindowEnd: windowEndTime },
            );
        }
    }

    /**
     * v3: Generate incremental sync batches if needed
     * Called when initialSyncDone = true
     */
    static async generateIncrementalBatches(userId: string): Promise<number> {
        const syncStatus = await OdooSyncStatus.findOne({ userId });

        if (!syncStatus || !syncStatus.initialSyncDone || !syncStatus.lastCompletedWindowEnd) {
            return 0;
        }

        const now = new Date();
        const lastCompleted = syncStatus.lastCompletedWindowEnd;
        const windowMs = SYNC_CONFIG.WINDOW_HOURS * 60 * 60 * 1000;

        // Check if it's time for a new incremental window
        if (now.getTime() < lastCompleted.getTime() + windowMs) {
            return 0; // Not yet time for next window
        }

        // Generate next incremental batch for each module
        let batchesCreated = 0;
        const nextStartTime = lastCompleted;
        const nextEndTime = addHours(nextStartTime, SYNC_CONFIG.WINDOW_HOURS);

        for (const odooModule of SYNC_CONFIG.SUPPORTED_MODULES) {
            // Check if batch already exists for this window
            const existingBatch = await OdooSyncBatch.findOne({
                userId,
                module: odooModule,
                startTime: nextStartTime,
                endTime: nextEndTime,
            });

            if (!existingBatch) {
                await OdooSyncBatch.create({
                    userId,
                    module: odooModule,
                    startTime: nextStartTime,
                    endTime: nextEndTime,
                    status: 'not_started',
                    attempts: 0,
                });

                console.log(
                    `[OdooSync] Created incremental batch for ${MODULE_DISPLAY_NAMES[odooModule]}: ${nextStartTime.toISOString()} to ${nextEndTime.toISOString()}`,
                );
                batchesCreated++;
            }
        }

        if (batchesCreated > 0) {
            console.log(`[OdooSync] Generated ${batchesCreated} incremental batches for user ${userId}`);
        }

        return batchesCreated;
    }
}
