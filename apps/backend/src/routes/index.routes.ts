import { Router } from 'express';

import { authenticateJWT } from '@/middleware/jwt.middleware';

import authRoutes from './auth.routes';
import dashboardRoutes from './dashboard.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/dashboard', authenticateJWT, dashboardRoutes);

export default router;
