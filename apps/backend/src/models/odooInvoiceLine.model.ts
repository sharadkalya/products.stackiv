import mongoose, { Schema, Document } from 'mongoose';

export interface IOdooInvoiceLine extends Document {
    userId: string;
    odooId: number;
    name: string;
    moveId?: number;
    moveName?: string;
    partnerId?: number;
    partnerName?: string;
    accountId?: number;
    accountName?: string;
    debit?: number;
    credit?: number;
    balance?: number;
    amountCurrency?: number;
    currencyId?: number;
    currencyName?: string;
    productId?: number;
    productName?: string;
    productUomId?: number;
    productUomName?: string;
    quantity?: number;
    taxBaseAmount?: number;
    companyId?: number;
    companyName?: string;
    journalId?: number;
    journalName?: string;
    date?: Date;
    dateMaturity?: Date;
    reconciled?: boolean;
    amountResidual?: number;
    amountResidualCurrency?: number;
    writeDate: Date;
    createDate: Date;
    rawData: any;
    createdAt: Date;
    updatedAt: Date;
}

const OdooInvoiceLineSchema: Schema = new Schema(
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
        moveId: { type: Number, index: true },
        moveName: { type: String },
        partnerId: { type: Number },
        partnerName: { type: String },
        accountId: { type: Number },
        accountName: { type: String },
        debit: { type: Number },
        credit: { type: Number },
        balance: { type: Number },
        amountCurrency: { type: Number },
        currencyId: { type: Number },
        currencyName: { type: String },
        productId: { type: Number },
        productName: { type: String },
        productUomId: { type: Number },
        productUomName: { type: String },
        quantity: { type: Number },
        taxBaseAmount: { type: Number },
        companyId: { type: Number },
        companyName: { type: String },
        journalId: { type: Number },
        journalName: { type: String },
        date: { type: Date },
        dateMaturity: { type: Date },
        reconciled: { type: Boolean },
        amountResidual: { type: Number },
        amountResidualCurrency: { type: Number },
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

OdooInvoiceLineSchema.index({ userId: 1, odooId: 1 }, { unique: true });
OdooInvoiceLineSchema.index({ userId: 1, moveId: 1 });

export const OdooInvoiceLine = mongoose.model<IOdooInvoiceLine>(
    'OdooInvoiceLine',
    OdooInvoiceLineSchema,
);
