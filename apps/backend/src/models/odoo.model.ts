import mongoose, { Schema, Document } from 'mongoose';
import { OdooConnectionDetails as BaseOdooConnection } from 'shared-types';

export interface IOdooConnectionDetails extends Omit<BaseOdooConnection, 'password'>, Document {
    password: string; // Will be encrypted
    createdAt: Date;
    updatedAt: Date;
}

const OdooConnectionDetailsSchema: Schema = new Schema(
    {
        userId: { type: String, required: true, index: true },
        orgName: { type: String, required: true },
        odooUrl: { type: String, required: true },
        dbName: { type: String, required: true },
        username: { type: String, required: true },
        password: { type: String, required: true },
        status: {
            type: String,
            enum: ['pending', 'success', 'fail'],
            default: 'pending',
        },
        lastConnectionTestAt: { type: Date },
    },
    { timestamps: true },
);

export const OdooConnectionDetails = mongoose.model<IOdooConnectionDetails>(
    'OdooConnectionDetails',
    OdooConnectionDetailsSchema,
);
