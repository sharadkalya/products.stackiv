import mongoose, { Schema, Document } from 'mongoose';

export interface IOdooEmployee extends Document {
    userId: string;
    odooId: number;
    name: string;
    workEmail?: string;
    workPhone?: string;
    mobile?: string;
    jobTitle?: string;
    departmentId?: number;
    departmentName?: string;
    managerId?: number;
    managerName?: string;
    companyId?: number;
    companyName?: string;
    workLocation?: string;
    active?: boolean;
    writeDate: Date;
    createDate: Date;
    rawData: any; // Store complete Odoo record for flexibility
    createdAt: Date;
    updatedAt: Date;
}

const OdooEmployeeSchema: Schema = new Schema(
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
        workEmail: {
            type: String,
        },
        workPhone: {
            type: String,
        },
        mobile: {
            type: String,
        },
        jobTitle: {
            type: String,
        },
        departmentId: {
            type: Number,
        },
        departmentName: {
            type: String,
        },
        managerId: {
            type: Number,
        },
        managerName: {
            type: String,
        },
        companyId: {
            type: Number,
        },
        companyName: {
            type: String,
        },
        workLocation: {
            type: String,
        },
        active: {
            type: Boolean,
            default: true,
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
OdooEmployeeSchema.index({ userId: 1, odooId: 1 }, { unique: true });

export const OdooEmployee = mongoose.model<IOdooEmployee>(
    'OdooEmployee',
    OdooEmployeeSchema,
);
