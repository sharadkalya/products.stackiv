import { Router } from 'express';

import { authenticateJWT } from '@/middleware/jwt.middleware';

import askRoutes from './ask.routes';
import authRoutes from './auth.routes';
import dashboardRoutes from './dashboard.routes';
import dummyRoutes from './dummy.routes';

const router: Router = Router();

router.use('/auth', authRoutes);
router.use('/dashboard', authenticateJWT, dashboardRoutes);
router.use('/ask', askRoutes);
router.use('/dummy', dummyRoutes);

export default router;
