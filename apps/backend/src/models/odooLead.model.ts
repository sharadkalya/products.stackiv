import mongoose, { Schema, Document } from 'mongoose';

export interface IOdooLead extends Document {
    userId: string;
    odooId: number;
    name: string;
    type?: string;
    active?: boolean;
    partnerId?: number;
    partnerName?: string;
    contactName?: string;
    emailFrom?: string;
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
    stageId?: number;
    stageName?: string;
    probability?: number;
    expectedRevenue?: number;
    proratedRevenue?: number;
    recurringRevenue?: number;
    recurringPlan?: string;
    dateDeadline?: Date;
    dateClosed?: Date;
    dateOpen?: Date;
    userIdOdoo?: number; // Salesperson
    userIdName?: string;
    teamId?: number;
    teamName?: string;
    companyId?: number;
    companyName?: string;
    priority?: string;
    description?: string;
    writeDate: Date;
    createDate: Date;
    rawData: any;
    createdAt: Date;
    updatedAt: Date;
}

const OdooLeadSchema: Schema = new Schema(
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
        type: { type: String },
        active: { type: Boolean },
        partnerId: { type: Number },
        partnerName: { type: String },
        contactName: { type: String },
        emailFrom: { type: String },
        phone: { type: String },
        mobile: { type: String },
        street: { type: String },
        street2: { type: String },
        city: { type: String },
        stateId: { type: Number },
        stateName: { type: String },
        zip: { type: String },
        countryId: { type: Number },
        countryName: { type: String },
        stageId: { type: Number },
        stageName: { type: String },
        probability: { type: Number },
        expectedRevenue: { type: Number },
        proratedRevenue: { type: Number },
        recurringRevenue: { type: Number },
        recurringPlan: { type: String },
        dateDeadline: { type: Date },
        dateClosed: { type: Date },
        dateOpen: { type: Date },
        userIdOdoo: { type: Number },
        userIdName: { type: String },
        teamId: { type: Number },
        teamName: { type: String },
        companyId: { type: Number },
        companyName: { type: String },
        priority: { type: String },
        description: { type: String },
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

OdooLeadSchema.index({ userId: 1, odooId: 1 }, { unique: true });
OdooLeadSchema.index({ userId: 1, type: 1, stageId: 1 });

export const OdooLead = mongoose.model<IOdooLead>(
    'OdooLead',
    OdooLeadSchema,
);
