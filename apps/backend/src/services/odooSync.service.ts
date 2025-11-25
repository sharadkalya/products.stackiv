import { SYNC_CONFIG, MODULE_DISPLAY_NAMES } from '@/config/sync.config';
import { OdooConnectionDetails } from '@/models/odoo.model';
import { OdooSyncBatch, BatchStatus } from '@/models/odooSyncBatch.model';
import { OdooSyncStatus } from '@/models/odooSyncStatus.model';
import { ModuleDataWriterService } from '@/services/moduleDataWriter.service';
import { OdooClientService, OdooConnection } from '@/services/odooClient.service';
import { WindowSizerService } from '@/services/windowSizer.service';
import { sleep } from '@/utils/sleep';
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
                const initialEndTime = addHours(initialStartTime, SYNC_CONFIG.MAX_WINDOW_HOURS);

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
     * Process the next batch for a user
     * - Finds next eligible batch
     * - Shrinks window to safe size
     * - Fetches and validates records
     * - Writes to database
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

            // Shrink window to safe size
            const windowResult = await WindowSizerService.shrinkWindow(
                conn,
                batch.module,
                batch.startTime,
                batch.endTime,
            );

            if (!windowResult.success || !windowResult.window) {
                throw new Error(windowResult.error || 'Failed to shrink window');
            }

            const { startTime, endTime, recordCount } = windowResult.window;
            batch.recordCountExpected = recordCount;

            console.log(
                `[OdooSync] Window shrunk to ${recordCount} records (${startTime.toISOString()} to ${endTime.toISOString()})`,
            );

            // If no records in this window, mark as done and create next batch immediately
            if (recordCount === 0) {
                batch.status = 'done';
                await batch.save();

                console.log(
                    `[OdooSync] No records in window for ${MODULE_DISPLAY_NAMES[batch.module]}, moving to next window`,
                );

                // Create next batch if there's more data to sync
                const now = new Date();
                if (endTime < now) {
                    const nextStartTime = endTime;
                    const nextEndTime = addHours(nextStartTime, SYNC_CONFIG.MAX_WINDOW_HOURS);

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

            // Sleep to avoid rate limiting
            await sleep(SYNC_CONFIG.API_CALL_DELAY_MS);

            // Fetch records
            const records = await OdooClientService.fetchRecords(
                conn,
                batch.module,
                startTime,
                endTime,
                SYNC_CONFIG.LIMIT_PER_CALL,
            );

            // Validate record count
            if (records.length !== recordCount) {
                throw new Error(
                    `Record count mismatch: expected ${recordCount}, got ${records.length}`,
                );
            }

            // Sleep again before write
            await sleep(SYNC_CONFIG.API_CALL_DELAY_MS);

            // Write records to database
            await ModuleDataWriterService.upsertRecords(userId, batch.module, records);

            console.log(
                `[OdooSync] Successfully wrote ${records.length} records for ${MODULE_DISPLAY_NAMES[batch.module]}`,
            );

            // Mark batch as done
            batch.status = 'done';
            await batch.save();

            // Create next batch if there's more data to sync
            const now = new Date();
            if (endTime < now) {
                const nextStartTime = endTime;
                const nextEndTime = addHours(nextStartTime, SYNC_CONFIG.MAX_WINDOW_HOURS);

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
            }

            return false;
        }
    }

    /**
     * Check if all batches are complete and update sync status
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

            await OdooSyncStatus.findOneAndUpdate(
                { userId },
                {
                    syncStatus: 'done',
                    lastSyncCompletedAt: new Date(),
                },
            );
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
}
