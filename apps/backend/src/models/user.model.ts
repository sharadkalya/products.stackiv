import mongoose, { Schema, Document } from 'mongoose';
import { User as BaseUser, UserRoles } from 'shared-types';

export interface IUser extends BaseUser, Document {
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema = new Schema(
    {
        firebaseUid: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true },
        name: { type: String }, // optional
        emailVerified: { type: Boolean, required: true },
        roles: {
            type: [String],
            enum: Object.values(UserRoles),
            required: true,
            default: ['Guest'],
        },
        firstName: { type: String },
        lastName: { type: String },
        phoneNumber: { type: Number },
        verified: { type: Boolean },
    },
    { timestamps: true },
);

export const User = mongoose.model<IUser>('User', UserSchema);
