import mongoose, { Schema, Document } from 'mongoose';

export interface IOdooPurchaseOrder extends Document {
    userId: string;
    odooId: number;
    name: string;
    partnerId?: number;
    partnerName?: string;
    partnerRef?: string;
    state?: string;
    dateOrder?: Date;
    dateApprove?: Date;
    datePlanned?: Date;
    amountUntaxed?: number;
    amountTax?: number;
    amountTotal?: number;
    currencyId?: number;
    currencyName?: string;
    companyId?: number;
    companyName?: string;
    userIdOdoo?: number; // Purchaser
    userIdName?: string;
    invoiceCount?: number;
    invoiceStatus?: string;
    destAddressId?: number;
    destAddressName?: string;
    pickingTypeId?: number;
    pickingTypeName?: string;
    paymentTermId?: number;
    paymentTermName?: string;
    fiscalPositionId?: number;
    fiscalPositionName?: string;
    notes?: string;
    origin?: string;
    writeDate: Date;
    createDate: Date;
    rawData: any;
    createdAt: Date;
    updatedAt: Date;
}

const OdooPurchaseOrderSchema: Schema = new Schema(
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
        partnerId: { type: Number },
        partnerName: { type: String },
        partnerRef: { type: String },
        state: { type: String },
        dateOrder: { type: Date },
        dateApprove: { type: Date },
        datePlanned: { type: Date },
        amountUntaxed: { type: Number },
        amountTax: { type: Number },
        amountTotal: { type: Number },
        currencyId: { type: Number },
        currencyName: { type: String },
        companyId: { type: Number },
        companyName: { type: String },
        userIdOdoo: { type: Number },
        userIdName: { type: String },
        invoiceCount: { type: Number },
        invoiceStatus: { type: String },
        destAddressId: { type: Number },
        destAddressName: { type: String },
        pickingTypeId: { type: Number },
        pickingTypeName: { type: String },
        paymentTermId: { type: Number },
        paymentTermName: { type: String },
        fiscalPositionId: { type: Number },
        fiscalPositionName: { type: String },
        notes: { type: String },
        origin: { type: String },
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

OdooPurchaseOrderSchema.index({ userId: 1, odooId: 1 }, { unique: true });

export const OdooPurchaseOrder = mongoose.model<IOdooPurchaseOrder>(
    'OdooPurchaseOrder',
    OdooPurchaseOrderSchema,
);
