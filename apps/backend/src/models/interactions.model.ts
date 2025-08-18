import mongoose, { Schema } from 'mongoose';

const InteractionsSchema: Schema = new Schema(
    {
        user: {
            type: String,
            required: true,
        },
        interactionName: {
            type: String,
            required: false,
        },
        documentType: {
            type: String,
            enum: ['text', 'pdf', 'docx'],
            required: true,
        },
        totalChunks: {
            type: Number,
            required: true,
        },
        embeddingModel: {
            type: String,
            required: true,
            default: 'cohere-small',
        },
        status: {
            type: String,
            enum: ['complete', 'error', 'processing'],
            default: 'processing',
            required: true,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
        updatedAt: {
            type: Date,
            default: Date.now,
        },
        parsedText: {
            type: String,
            required: false,
        },
    },
    { timestamps: true },
);

// Middleware to update the updatedAt field before saving
InteractionsSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

export const Interactions = mongoose.model('Interactions', InteractionsSchema);
