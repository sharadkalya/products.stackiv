import mongoose, { Schema, Document } from 'mongoose';

export interface IOdooSaleOrderLine extends Document {
    userId: string;
    odooId: number;
    name: string;
    orderId?: number;
    orderName?: string;
    orderPartnerId?: number;
    orderPartnerName?: string;
    sequence?: number;
    productId?: number;
    productName?: string;
    productTemplateId?: number;
    productUomQty?: number;
    productUom?: string;
    qtyDelivered?: number;
    qtyInvoiced?: number;
    qtyToInvoice?: number;
    priceUnit?: number;
    priceSubtotal?: number;
    priceTotal?: number;
    priceTax?: number;
    discount?: number;
    state?: string;
    invoiceStatus?: string;
    currency?: string;
    companyId?: number;
    companyName?: string;
    salesmanId?: number;
    salesmanName?: string;
    writeDate: Date;
    createDate: Date;
    rawData: any; // Store complete Odoo record for flexibility
    createdAt: Date;
    updatedAt: Date;
}

const OdooSaleOrderLineSchema: Schema = new Schema(
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
        orderId: {
            type: Number,
            index: true,
        },
        orderName: {
            type: String,
        },
        orderPartnerId: {
            type: Number,
        },
        orderPartnerName: {
            type: String,
        },
        sequence: {
            type: Number,
        },
        productId: {
            type: Number,
        },
        productName: {
            type: String,
        },
        productTemplateId: {
            type: Number,
        },
        productUomQty: {
            type: Number,
        },
        productUom: {
            type: String,
        },
        qtyDelivered: {
            type: Number,
        },
        qtyInvoiced: {
            type: Number,
        },
        qtyToInvoice: {
            type: Number,
        },
        priceUnit: {
            type: Number,
        },
        priceSubtotal: {
            type: Number,
        },
        priceTotal: {
            type: Number,
        },
        priceTax: {
            type: Number,
        },
        discount: {
            type: Number,
        },
        state: {
            type: String,
        },
        invoiceStatus: {
            type: String,
        },
        currency: {
            type: String,
        },
        companyId: {
            type: Number,
        },
        companyName: {
            type: String,
        },
        salesmanId: {
            type: Number,
        },
        salesmanName: {
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
OdooSaleOrderLineSchema.index({ userId: 1, odooId: 1 }, { unique: true });

// Index for querying by order
OdooSaleOrderLineSchema.index({ userId: 1, orderId: 1 });

// Performance indexes for dashboard aggregations
OdooSaleOrderLineSchema.index({ userId: 1, state: 1, productId: 1 });
OdooSaleOrderLineSchema.index({ userId: 1, orderId: 1, state: 1 });

export const OdooSaleOrderLine = mongoose.model<IOdooSaleOrderLine>(
    'OdooSaleOrderLine',
    OdooSaleOrderLineSchema,
);
