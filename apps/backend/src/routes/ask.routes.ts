import { Router } from 'express';

import { ingestFile, ingestText, query } from '@/controllers/ask.controller';
import { requireBody } from '@/middlewarerequireBody.middleware';

const router: Router = Router();
router.post('/query', requireBody, query);
router.post('/ingest/file', requireBody, ingestFile);
router.post('/ingest/text', requireBody, ingestText);

export default router;
