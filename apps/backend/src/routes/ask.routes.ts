import { Router } from 'express';

import { getFaq, getSummary, ingestFile, ingestText, query } from '@/controllers/ask.controller';
import { requireBody } from '@/middlewarerequireBody.middleware';

const router: Router = Router();
router.post('/query', requireBody, query);
router.post('/summary', requireBody, getSummary);
router.post('/faq', requireBody, getFaq);
router.post('/ingest/file', requireBody, ingestFile);
router.post('/ingest/text', requireBody, ingestText);

export default router;
