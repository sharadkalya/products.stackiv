import mongoose, { Schema, Document } from 'mongoose';

export interface IOdooPurchaseOrderLine extends Document {
    userId: string;
    odooId: number;
    name: string;
    orderId?: number;
    orderName?: string;
    partnerId?: number;
    partnerName?: string;
    sequence?: number;
    productId?: number;
    productName?: string;
    productUom?: number;
    productUomName?: string;
    productQty?: number;
    qtyReceived?: number;
    qtyInvoiced?: number;
    priceUnit?: number;
    priceSubtotal?: number;
    priceTotal?: number;
    priceTax?: number;
    datePlanned?: Date;
    dateOrder?: Date;
    currencyId?: number;
    currencyName?: string;
    companyId?: number;
    companyName?: string;
    state?: string;
    writeDate: Date;
    createDate: Date;
    rawData: any;
    createdAt: Date;
    updatedAt: Date;
}

const OdooPurchaseOrderLineSchema: Schema = new Schema(
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
        orderId: { type: Number, index: true },
        orderName: { type: String },
        partnerId: { type: Number },
        partnerName: { type: String },
        sequence: { type: Number },
        productId: { type: Number },
        productName: { type: String },
        productUom: { type: Number },
        productUomName: { type: String },
        productQty: { type: Number },
        qtyReceived: { type: Number },
        qtyInvoiced: { type: Number },
        priceUnit: { type: Number },
        priceSubtotal: { type: Number },
        priceTotal: { type: Number },
        priceTax: { type: Number },
        datePlanned: { type: Date },
        dateOrder: { type: Date },
        currencyId: { type: Number },
        currencyName: { type: String },
        companyId: { type: Number },
        companyName: { type: String },
        state: { type: String },
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

OdooPurchaseOrderLineSchema.index({ userId: 1, odooId: 1 }, { unique: true });
OdooPurchaseOrderLineSchema.index({ userId: 1, orderId: 1 });

export const OdooPurchaseOrderLine = mongoose.model<IOdooPurchaseOrderLine>(
    'OdooPurchaseOrderLine',
    OdooPurchaseOrderLineSchema,
);
