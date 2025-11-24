import { Router } from 'express';

import { getConnection, getDashboard, getStatus, initDashboard, saveConnection, testConnection } from '@/controllers/odoo.controller';

const router: Router = Router();

router.get('/status', getStatus);
router.get('/init', initDashboard);
router.get('/dashboard', getDashboard);
router.post('/test-connection', testConnection);
router.post('/save-connection', saveConnection);
router.get('/connection', getConnection);

export default router;
