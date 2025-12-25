import mongoose, { Schema, Document } from 'mongoose';

export interface IOdooProduct extends Document {
    userId: string;
    odooId: number;
    name: string;
    productTmplId?: number;
    defaultCode?: string;
    barcode?: string;
    type?: string;
    detailedType?: string;
    categId?: number;
    categName?: string;
    listPrice?: number;
    standardPrice?: number;
    currencyId?: number;
    currencyName?: string;
    saleOk?: boolean;
    purchaseOk?: boolean;
    qtyAvailable?: number;
    virtualAvailable?: number;
    uomId?: number;
    uomName?: string;
    uomPoId?: number;
    uomPoName?: string;
    tracking?: string;
    active?: boolean;
    companyId?: number;
    companyName?: string;
    weight?: number;
    volume?: number;
    description?: string;
    descriptionSale?: string;
    descriptionPurchase?: string;
    writeDate: Date;
    createDate: Date;
    rawData: any;
    createdAt: Date;
    updatedAt: Date;
}

const OdooProductSchema: Schema = new Schema(
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
        productTmplId: { type: Number },
        defaultCode: { type: String, index: true }, // SKU
        barcode: { type: String, index: true },
        type: { type: String },
        detailedType: { type: String },
        categId: { type: Number },
        categName: { type: String },
        listPrice: { type: Number },
        standardPrice: { type: Number },
        currencyId: { type: Number },
        currencyName: { type: String },
        saleOk: { type: Boolean },
        purchaseOk: { type: Boolean },
        qtyAvailable: { type: Number },
        virtualAvailable: { type: Number },
        uomId: { type: Number },
        uomName: { type: String },
        uomPoId: { type: Number },
        uomPoName: { type: String },
        tracking: { type: String },
        active: { type: Boolean },
        companyId: { type: Number },
        companyName: { type: String },
        weight: { type: Number },
        volume: { type: Number },
        description: { type: String },
        descriptionSale: { type: String },
        descriptionPurchase: { type: String },
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

OdooProductSchema.index({ userId: 1, odooId: 1 }, { unique: true });
OdooProductSchema.index({ userId: 1, defaultCode: 1 });
OdooProductSchema.index({ userId: 1, barcode: 1 });

export const OdooProduct = mongoose.model<IOdooProduct>(
    'OdooProduct',
    OdooProductSchema,
);
