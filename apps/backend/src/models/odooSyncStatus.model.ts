import mongoose, { Schema, Document } from 'mongoose';

export type SyncStatus = 'not_started' | 'pending' | 'in_progress' | 'done' | 'failed';

export interface IOdooSyncStatus extends Document {
    userId: string;
    connectionInfoAvailable: boolean;
    syncStatus: SyncStatus | null;
    lastSyncStartedAt?: Date | null;
    lastSyncCompletedAt?: Date | null;
    lastSyncFailedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

const OdooSyncStatusSchema: Schema = new Schema(
    {
        userId: { type: String, required: true, unique: true, index: true },
        connectionInfoAvailable: { type: Boolean, required: true, default: false },
        syncStatus: {
            type: String,
            enum: ['not_started', 'pending', 'in_progress', 'done', 'failed'],
            default: null,
        },
        lastSyncStartedAt: { type: Date, default: null },
        lastSyncCompletedAt: { type: Date, default: null },
        lastSyncFailedAt: { type: Date, default: null },
    },
    { timestamps: true },
);

export const OdooSyncStatus = mongoose.model<IOdooSyncStatus>(
    'OdooSyncStatus',
    OdooSyncStatusSchema,
);
