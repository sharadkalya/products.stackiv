import { Request, Response } from 'express';

import { OdooSyncBatch } from '@/models/odooSyncBatch.model';
import { OdooSyncService } from '@/services/odooSync.service';

/**
 * Get batches with pagination and filters
 */
export async function getBatches(req: Request, res: Response): Promise<void> {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = 25;
        const userId = req.query.userId as string;
        const status = req.query.status as string;
        const skip = (page - 1) * limit;

        if (!userId) {
            res.status(400).json({
                success: false,
                message: 'userId is required',
            });
            return;
        }

        // Build filter
        const filter: any = { userId };
        if (status && status !== 'all') {
            if (status === 'failed') {
                filter.status = { $in: ['failed', 'permanently_failed'] };
            } else {
                filter.status = status;
            }
        }

        // Get batches
        const batches = await OdooSyncBatch.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await OdooSyncBatch.countDocuments(filter);

        // Transform data
        const transformedBatches = batches.map(batch => ({
            id: batch._id,
            userId: batch.userId,
            module: batch.module,
            status: batch.status,
            startTime: batch.startTime,
            endTime: batch.endTime,
            attempts: batch.attempts,
            recordCountExpected: batch.recordCountExpected || 0,
            lastError: batch.lastError,
            lastProcessedId: batch.lastProcessedId,
            createdAt: batch.createdAt,
            updatedAt: batch.updatedAt,
        }));

        res.status(200).json({
            success: true,
            data: transformedBatches,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching batches:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch batches',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}

/**
 * Retry a failed batch
 */
export async function retryBatch(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;

        const batch = await OdooSyncBatch.findById(id);

        if (!batch) {
            res.status(404).json({
                success: false,
                message: 'Batch not found',
            });
            return;
        }

        // Reset batch status to allow retry
        batch.status = 'not_started';
        batch.attempts = 0;
        batch.lastError = undefined;
        await batch.save();

        // Process the batch immediately
        const userId = batch.userId;
        await OdooSyncService.processNextBatch(userId);

        // Fetch updated batch
        const updatedBatch = await OdooSyncBatch.findById(id).lean();

        res.status(200).json({
            success: true,
            message: 'Batch retry initiated',
            data: {
                id: updatedBatch?._id,
                userId: updatedBatch?.userId,
                module: updatedBatch?.module,
                status: updatedBatch?.status,
                attempts: updatedBatch?.attempts,
                lastError: updatedBatch?.lastError,
            },
        });
    } catch (error) {
        console.error('Error retrying batch:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retry batch',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
