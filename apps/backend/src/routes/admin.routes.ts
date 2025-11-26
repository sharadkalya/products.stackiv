import express from 'express';

import { getSyncHistory, getSyncHistoryById } from '@/controllers/admin.controller';
import { getBatches, retryBatch } from '@/controllers/adminBatch.controller';
import { adminLogin, verifyAdminToken } from '@/middleware/admin.middleware';

const router = express.Router();

// Public login endpoint
router.post('/login', adminLogin);

// Protected admin routes - all require admin token
router.get('/sync-history', verifyAdminToken, getSyncHistory);
router.get('/sync-history/:id', verifyAdminToken, getSyncHistoryById);
router.get('/batches', verifyAdminToken, getBatches);
router.post('/batches/:id/retry', verifyAdminToken, retryBatch);

export default router;
