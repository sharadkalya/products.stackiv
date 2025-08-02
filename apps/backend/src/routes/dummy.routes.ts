import { Router } from 'express';

import { getDummy } from '@/controllers/dummy.controller';
const router: Router = Router();

router.get('/', getDummy);

export default router;
