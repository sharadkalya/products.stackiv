import { Router } from 'express';

import { getConnection, testConnection } from '@/controllers/odoo.controller';

const router: Router = Router();

router.post('/test-connection', testConnection);
router.get('/connection', getConnection);

export default router;
