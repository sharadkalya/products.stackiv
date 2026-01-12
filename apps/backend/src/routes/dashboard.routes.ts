import { Router } from 'express';

import { getDashboardData } from '@/controllers/dashboard.controller';
import { authenticateJWT } from '@/middleware/jwt.middleware';

const router: Router = Router();

// General dashboard (legacy)
router.get('/', authenticateJWT, getDashboardData);

export default router;
