import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

import { connectDB } from './db';
import routes from './routes/index.routes';

dotenv.config();

// Define limiter - example: max 100 requests per 15 minutes per IP
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true, // return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // disable the `X-RateLimit-*` headers
});
const app = express();

// Use FRONTEND_URL env var here
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';

// Apply to all requests

app.use(cookieParser());
app.use(limiter);
app.use(helmet());
app.use(
    cors({
        origin: frontendUrl,
        credentials: true,
        exposedHeaders: ['Authorization'],
    }),
);
app.use(express.json());
app.use('/api', routes);

const PORT = process.env.PORT ?? 5001;

app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

async function startServer() {
    await connectDB();
}

startServer();
