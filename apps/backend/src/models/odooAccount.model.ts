import mongoose, { Schema, Document } from 'mongoose';

export interface IOdooAccount extends Document {
    userId: string;
    odooId: number;
    name: string;
    code?: string;
    accountType?: string;
    deprecated?: boolean;
    reconcile?: boolean;
    currencyId?: number;
    currencyName?: string;
    companyId?: number;
    companyName?: string;
    groupId?: number;
    groupName?: string;
    note?: string;
    writeDate: Date;
    createDate: Date;
    rawData: any;
    createdAt: Date;
    updatedAt: Date;
}

const OdooAccountSchema: Schema = new Schema(
    {
        userId: {
            type: String,
            required: true,
            index: true,
        },
        odooId: {
            type: Number,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        code: { type: String, index: true },
        accountType: { type: String },
        deprecated: { type: Boolean },
        reconcile: { type: Boolean },
        currencyId: { type: Number },
        currencyName: { type: String },
        companyId: { type: Number },
        companyName: { type: String },
        groupId: { type: Number },
        groupName: { type: String },
        note: { type: String },
        writeDate: {
            type: Date,
            required: true,
            index: true,
        },
        createDate: {
            type: Date,
            required: true,
        },
        rawData: {
            type: Schema.Types.Mixed,
        },
    },
    {
        timestamps: true,
    },
);

OdooAccountSchema.index({ userId: 1, odooId: 1 }, { unique: true });
OdooAccountSchema.index({ userId: 1, code: 1 });

export const OdooAccount = mongoose.model<IOdooAccount>(
    'OdooAccount',
    OdooAccountSchema,
);
