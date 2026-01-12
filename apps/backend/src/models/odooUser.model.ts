import mongoose, { Schema, Document } from 'mongoose';

export interface IOdooUser extends Document {
    userId: string;
    odooId: number;
    name: string;
    login?: string;
    email?: string;
    partnerId?: number;
    partnerName?: string;
    companyId?: number;
    companyName?: string;
    lang?: string;
    tz?: string;
    active?: boolean;
    notificationType?: string;
    writeDate: Date;
    createDate: Date;
    rawData: any;
    createdAt: Date;
    updatedAt: Date;
}

const OdooUserSchema: Schema = new Schema(
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
        login: { type: String },
        email: { type: String },
        partnerId: { type: Number },
        partnerName: { type: String },
        companyId: { type: Number },
        companyName: { type: String },
        lang: { type: String },
        tz: { type: String },
        active: { type: Boolean },
        notificationType: { type: String },
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

OdooUserSchema.index({ userId: 1, odooId: 1 }, { unique: true });

export const OdooUser = mongoose.model<IOdooUser>(
    'OdooUser',
    OdooUserSchema,
);
