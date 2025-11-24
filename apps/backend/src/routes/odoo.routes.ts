import { Router } from 'express';

import { getConnection, saveConnection, testConnection } from '@/controllers/odoo.controller';

const router: Router = Router();

router.post('/test-connection', testConnection);
router.post('/save-connection', saveConnection);
router.get('/connection', getConnection);

export default router;
