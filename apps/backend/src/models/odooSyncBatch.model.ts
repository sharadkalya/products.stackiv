import mongoose, { Schema, Document } from 'mongoose';

import { SupportedModule } from '@/config/sync.config';

export type BatchStatus = 'not_started' | 'in_progress' | 'failed' | 'done' | 'permanently_failed';

export interface IOdooSyncBatch extends Document {
    userId: string;
    module: SupportedModule;
    startTime: Date;
    endTime: Date;
    status: BatchStatus;
    attempts: number;
    recordCountExpected?: number;
    lastError?: string;
    createdAt: Date;
    updatedAt: Date;
}

const OdooSyncBatchSchema: Schema = new Schema(
    {
        userId: {
            type: String,
            required: true,
            index: true,
        },
        module: {
            type: String,
            required: true,
            enum: ['sale.order', 'account.move', 'res.partner', 'hr.employee'],
            index: true,
        },
        startTime: {
            type: Date,
            required: true,
            index: true,
        },
        endTime: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            required: true,
            enum: ['not_started', 'in_progress', 'failed', 'done', 'permanently_failed'],
            default: 'not_started',
            index: true,
        },
        attempts: {
            type: Number,
            required: true,
            default: 0,
        },
        recordCountExpected: {
            type: Number,
        },
        lastError: {
            type: String,
        },
    },
    {
        timestamps: true,
    },
);

// Compound indexes for efficient queries
OdooSyncBatchSchema.index({ userId: 1, module: 1, startTime: 1 });
OdooSyncBatchSchema.index({ userId: 1, status: 1, attempts: 1, startTime: 1 });

export const OdooSyncBatch = mongoose.model<IOdooSyncBatch>(
    'OdooSyncBatch',
    OdooSyncBatchSchema,
);
