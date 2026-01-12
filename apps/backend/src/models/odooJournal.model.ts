import mongoose, { Schema, Document } from 'mongoose';

export interface IOdooJournal extends Document {
    userId: string;
    odooId: number;
    name: string;
    code?: string;
    type?: string;
    active?: boolean;
    currencyId?: number;
    currencyName?: string;
    companyId?: number;
    companyName?: string;
    sequence?: number;
    writeDate: Date;
    createDate: Date;
    rawData: any;
    createdAt: Date;
    updatedAt: Date;
}

const OdooJournalSchema: Schema = new Schema(
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
        type: { type: String },
        active: { type: Boolean },
        currencyId: { type: Number },
        currencyName: { type: String },
        companyId: { type: Number },
        companyName: { type: String },
        sequence: { type: Number },
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

OdooJournalSchema.index({ userId: 1, odooId: 1 }, { unique: true });
OdooJournalSchema.index({ userId: 1, code: 1 });

export const OdooJournal = mongoose.model<IOdooJournal>(
    'OdooJournal',
    OdooJournalSchema,
);
