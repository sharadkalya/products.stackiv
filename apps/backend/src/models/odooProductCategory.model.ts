import mongoose, { Schema, Document } from 'mongoose';

export interface IOdooProductCategory extends Document {
    userId: string;
    odooId: number;
    name: string;
    completeName?: string;
    parentId?: number;
    parentName?: string;
    parentPath?: string;
    writeDate: Date;
    createDate: Date;
    rawData: any;
    createdAt: Date;
    updatedAt: Date;
}

const OdooProductCategorySchema: Schema = new Schema(
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
        completeName: { type: String },
        parentId: { type: Number },
        parentName: { type: String },
        parentPath: { type: String },
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

OdooProductCategorySchema.index({ userId: 1, odooId: 1 }, { unique: true });

export const OdooProductCategory = mongoose.model<IOdooProductCategory>(
    'OdooProductCategory',
    OdooProductCategorySchema,
);
