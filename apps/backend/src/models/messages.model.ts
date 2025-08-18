import { Schema, model, Document } from 'mongoose';

export interface IMessage extends Document {
    interactionId: string;
    createdAt: Date;
    updatedAt: Date;
    pending: boolean;
    query: string;
    response?: string;
}

const messageSchema = new Schema<IMessage>({
    interactionId: {
        type: String,
        required: true,
        index: true
    },
    pending: {
        type: Boolean,
        default: false
    },
    query: {
        type: String,
        required: true
    },
    response: {
        type: String,
        default: ''
    }
}, {
    timestamps: true // This automatically adds createdAt and updatedAt
});

export const Message = model<IMessage>('Message', messageSchema);
