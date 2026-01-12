import mongoose, { Schema, Document } from 'mongoose';

export interface IOdooSaleOrder extends Document {
    userId: string;
    odooId: number;
    name: string;
    partnerId?: number;
    partnerName?: string;
    dateOrder?: Date;
    amountTotal?: number;
    amountUntaxed?: number;
    amountTax?: number;
    state?: string;
    currency?: string;
    writeDate: Date;
    createDate: Date;
    rawData: any; // Store complete Odoo record for flexibility
    createdAt: Date;
    updatedAt: Date;
}

const OdooSaleOrderSchema: Schema = new Schema(
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
        partnerId: {
            type: Number,
        },
        partnerName: {
            type: String,
        },
        dateOrder: {
            type: Date,
        },
        amountTotal: {
            type: Number,
        },
        amountUntaxed: {
            type: Number,
        },
        amountTax: {
            type: Number,
        },
        state: {
            type: String,
        },
        currency: {
            type: String,
        },
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

// Unique index to prevent duplicates
OdooSaleOrderSchema.index({ userId: 1, odooId: 1 }, { unique: true });

// Performance indexes for dashboard queries
OdooSaleOrderSchema.index({ userId: 1, state: 1, dateOrder: 1 });
OdooSaleOrderSchema.index({ userId: 1, state: 1, partnerId: 1, dateOrder: 1 });

export const OdooSaleOrder = mongoose.model<IOdooSaleOrder>(
    'OdooSaleOrder',
    OdooSaleOrderSchema,
);
