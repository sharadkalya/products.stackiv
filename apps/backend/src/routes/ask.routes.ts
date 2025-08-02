import { Router } from 'express';

import { ask } from '@/controllers/ask.controller';
import { requireBody } from '@/middlewarerequireBody.middleware';

const router: Router = Router();
router.post('/', requireBody, ask);

export default router;
