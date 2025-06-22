import dotenv from 'dotenv';
import mongoose from 'mongoose';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
}

export async function connectDB() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('MongoDB connected');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
}
