import mongoose, { Schema, Document } from 'mongoose';

export interface IOdooInvoice extends Document {
    userId: string;
    odooId: number;
    name: string;
    partnerId?: number;
    partnerName?: string;
    invoiceDate?: Date;
    invoiceDateDue?: Date;
    amountTotal?: number;
    amountUntaxed?: number;
    amountTax?: number;
    amountResidual?: number;
    state?: string;
    moveType?: string;
    currency?: string;
    paymentState?: string;
    writeDate: Date;
    createDate: Date;
    rawData: any; // Store complete Odoo record for flexibility
    createdAt: Date;
    updatedAt: Date;
}

const OdooInvoiceSchema: Schema = new Schema(
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
        invoiceDate: {
            type: Date,
        },
        invoiceDateDue: {
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
        amountResidual: {
            type: Number,
        },
        state: {
            type: String,
        },
        moveType: {
            type: String,
        },
        currency: {
            type: String,
        },
        paymentState: {
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
OdooInvoiceSchema.index({ userId: 1, odooId: 1 }, { unique: true });

export const OdooInvoice = mongoose.model<IOdooInvoice>(
    'OdooInvoice',
    OdooInvoiceSchema,
);
