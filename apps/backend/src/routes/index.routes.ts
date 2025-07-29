import { Router } from 'express';

import authRoutes from './auth.routes';
import dashboardRoutes from './dashboard.routes';

import { authenticateJWT } from '@/middleware/jwt.middleware';

const router: Router = Router();

router.use('/auth', authRoutes);
router.use('/dashboard', authenticateJWT, dashboardRoutes);

export default router;
