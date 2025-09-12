import { Router } from 'express';

import { getFaq, getSummary, getHistory, getInteraction, ingestFile, ingestText, query, getQueryHistory } from '@/controllers/ask.controller';
import { requireBody } from '@/middleware/requireBody.middleware';

const router: Router = Router();
router.post('/query', requireBody, query);
router.post('/query/history', requireBody, getQueryHistory);
router.post('/summary', requireBody, getSummary);
router.post('/faq', requireBody, getFaq);
router.post('/history', requireBody, getHistory);
router.get('/interaction/:interactionId', getInteraction);
router.post('/ingest/file', requireBody, ingestFile);
router.post('/ingest/text', requireBody, ingestText);

export default router;
