import mongoose, { Schema, Document } from 'mongoose';

export type SyncSessionType = 'initial' | 'incremental';
export type SyncSessionStatus = 'in_progress' | 'success' | 'failed' | 'partial';

export interface ISyncSession extends Document {
    userId: string;
    type: SyncSessionType;
    startAt: Date;
    endAt?: Date | null;
    status: SyncSessionStatus;
    totalBatches: number;
    successfulBatches: number;
    failedBatches: number;
    createdAt: Date;
    updatedAt: Date;
}

const SyncSessionSchema: Schema = new Schema(
    {
        userId: { type: String, required: true, index: true },
        type: {
            type: String,
            enum: ['initial', 'incremental'],
            required: true,
        },
        startAt: { type: Date, required: true },
        endAt: { type: Date, default: null },
        status: {
            type: String,
            enum: ['in_progress', 'success', 'failed', 'partial'],
            required: true,
            default: 'in_progress',
        },
        totalBatches: { type: Number, default: 0 },
        successfulBatches: { type: Number, default: 0 },
        failedBatches: { type: Number, default: 0 },
    },
    { timestamps: true },
);

// Index for efficient queries
SyncSessionSchema.index({ userId: 1, createdAt: -1 });

export const SyncSession = mongoose.model<ISyncSession>('SyncSession', SyncSessionSchema);
