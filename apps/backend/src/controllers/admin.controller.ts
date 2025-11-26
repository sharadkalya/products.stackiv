import { Request, Response } from 'express';
import { OdooSyncStatus } from '@/models/odooSyncStatus.model';
import { OdooSyncBatch } from '@/models/odooSyncBatch.model';
import { OdooConnectionDetails } from '@/models/odoo.model';

/**
 * Get sync history with pagination and search
 */
export async function getSyncHistory(req: Request, res: Response): Promise<void> {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = 25;
        const search = req.query.search as string || '';
        const skip = (page - 1) * limit;

        // Build search filter
        let filter: any = {};
        if (search) {
            // Search by user ID or connection details
            const connectionDetails = await OdooConnectionDetails.find({
                $or: [
                    { username: { $regex: search, $options: 'i' } },
                    { odooUrl: { $regex: search, $options: 'i' } },
                ],
            }).select('userId');

            const userIds = connectionDetails.map(c => c.userId);

            filter = {
                $or: [
                    { userId: { $regex: search, $options: 'i' } },
                    { userId: { $in: userIds } },
                ],
            };
        }

        // Get sync history
        const syncHistories = await OdooSyncStatus.find(filter)
            .sort({ lastSyncStartedAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await OdooSyncStatus.countDocuments(filter);

        // Enrich with connection details
        const enrichedData = await Promise.all(
            syncHistories.map(async (sync) => {
                const connectionDetails = await OdooConnectionDetails.findOne({
                    userId: sync.userId,
                }).lean();

                return {
                    id: sync._id,
                    userId: sync.userId,
                    customerName: connectionDetails?.username || 'Unknown',
                    customerEmail: connectionDetails?.username || 'N/A',
                    odooUrl: connectionDetails?.odooUrl || 'N/A',
                    status: sync.syncStatus,
                    initialSyncDone: sync.initialSyncDone || false,
                    hasFailedBatches: sync.hasFailedBatches || false,
                    lastSyncAt: sync.lastSyncCompletedAt || sync.lastSyncStartedAt,
                    startTime: sync.lastSyncStartedAt,
                    endTime: sync.lastSyncCompletedAt,
                    lastCompletedWindowEnd: sync.lastCompletedWindowEnd,
                    createdAt: sync.createdAt,
                    updatedAt: sync.updatedAt,
                };
            }),
        );

        res.status(200).json({
            success: true,
            data: enrichedData,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching sync history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch sync history',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}

/**
 * Get sync history details by ID
 */
export async function getSyncHistoryById(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;

        const syncStatus = await OdooSyncStatus.findById(id).lean();

        if (!syncStatus) {
            res.status(404).json({
                success: false,
                message: 'Sync history not found',
            });
            return;
        }

        // Get connection details
        const connectionDetails = await OdooConnectionDetails.findOne({
            userId: syncStatus.userId,
        }).lean();

        // Get batch statistics
        const batches = await OdooSyncBatch.find({ userId: syncStatus.userId });
        const batchStats = {
            total: batches.length,
            done: batches.filter(b => b.status === 'done').length,
            failed: batches.filter(b => b.status === 'failed' || b.status === 'permanently_failed').length,
            inProgress: batches.filter(b => b.status === 'in_progress').length,
            notStarted: batches.filter(b => b.status === 'not_started').length,
        };

        res.status(200).json({
            success: true,
            data: {
                id: syncStatus._id,
                userId: syncStatus.userId,
                customerName: connectionDetails?.username || 'Unknown',
                customerEmail: connectionDetails?.username || 'N/A',
                odooUrl: connectionDetails?.odooUrl || 'N/A',
                dbName: connectionDetails?.dbName || 'N/A',
                status: syncStatus.syncStatus,
                initialSyncDone: syncStatus.initialSyncDone || false,
                hasFailedBatches: syncStatus.hasFailedBatches || false,
                lastCompletedWindowEnd: syncStatus.lastCompletedWindowEnd,
                startTime: syncStatus.lastSyncStartedAt,
                endTime: syncStatus.lastSyncCompletedAt,
                failedAt: syncStatus.lastSyncFailedAt,
                batchStats,
                createdAt: syncStatus.createdAt,
                updatedAt: syncStatus.updatedAt,
            },
        });
    } catch (error) {
        console.error('Error fetching sync history details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch sync history details',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
