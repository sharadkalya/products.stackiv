import mongoose, { Schema, Document } from 'mongoose';

export interface IOdooCompany extends Document {
    userId: string;
    odooId: number;
    name: string;
    email?: string;
    phone?: string;
    website?: string;
    vat?: string;
    street?: string;
    street2?: string;
    city?: string;
    stateId?: number;
    stateName?: string;
    zip?: string;
    countryId?: number;
    countryName?: string;
    currencyId?: number;
    currencyName?: string;
    parentId?: number;
    parentName?: string;
    active?: boolean;
    writeDate: Date;
    createDate: Date;
    rawData: any;
    createdAt: Date;
    updatedAt: Date;
}

const OdooCompanySchema: Schema = new Schema(
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
        email: { type: String },
        phone: { type: String },
        website: { type: String },
        vat: { type: String },
        street: { type: String },
        street2: { type: String },
        city: { type: String },
        stateId: { type: Number },
        stateName: { type: String },
        zip: { type: String },
        countryId: { type: Number },
        countryName: { type: String },
        currencyId: { type: Number },
        currencyName: { type: String },
        parentId: { type: Number },
        parentName: { type: String },
        active: { type: Boolean },
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

OdooCompanySchema.index({ userId: 1, odooId: 1 }, { unique: true });

export const OdooCompany = mongoose.model<IOdooCompany>(
    'OdooCompany',
    OdooCompanySchema,
);
