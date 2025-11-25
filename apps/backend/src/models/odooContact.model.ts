import mongoose, { Schema, Document } from 'mongoose';

export interface IOdooContact extends Document {
    userId: string;
    odooId: number;
    name: string;
    email?: string;
    phone?: string;
    mobile?: string;
    street?: string;
    street2?: string;
    city?: string;
    stateId?: number;
    stateName?: string;
    zip?: string;
    countryId?: number;
    countryName?: string;
    website?: string;
    isCompany?: boolean;
    companyType?: string;
    parentId?: number;
    parentName?: string;
    writeDate: Date;
    createDate: Date;
    rawData: any; // Store complete Odoo record for flexibility
    createdAt: Date;
    updatedAt: Date;
}

const OdooContactSchema: Schema = new Schema(
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
        email: {
            type: String,
        },
        phone: {
            type: String,
        },
        mobile: {
            type: String,
        },
        street: {
            type: String,
        },
        street2: {
            type: String,
        },
        city: {
            type: String,
        },
        stateId: {
            type: Number,
        },
        stateName: {
            type: String,
        },
        zip: {
            type: String,
        },
        countryId: {
            type: Number,
        },
        countryName: {
            type: String,
        },
        website: {
            type: String,
        },
        isCompany: {
            type: Boolean,
        },
        companyType: {
            type: String,
        },
        parentId: {
            type: Number,
        },
        parentName: {
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
OdooContactSchema.index({ userId: 1, odooId: 1 }, { unique: true });

export const OdooContact = mongoose.model<IOdooContact>(
    'OdooContact',
    OdooContactSchema,
);
