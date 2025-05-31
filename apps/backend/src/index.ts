import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const cors = require('cors');

app.use(
    cors({
        origin: 'http://localhost:3001',
    })
);
const PORT = process.env.PORT || 5001;

app.get('/', (_req, res) => {
    res.send('Hello World from StayInn Backend!');
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
