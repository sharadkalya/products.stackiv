import { Router } from 'express';

import { authenticateJWT } from '@/middleware/jwt.middleware';

import adminRoutes from './admin.routes';
import askRoutes from './ask.routes';
import authRoutes from './auth.routes';
import dashboardRoutes from './dashboard.routes';
import dummyRoutes from './dummy.routes';
import odooRoutes from './odoo.routes';

const router: Router = Router();

router.use('/auth', authRoutes);
router.use('/dashboard', authenticateJWT, dashboardRoutes);
router.use('/ask', askRoutes);
router.use('/dummy', dummyRoutes);
router.use('/odoo', authenticateJWT, odooRoutes);
router.use('/admin', adminRoutes); // Public routes (login) and protected routes (with verifyAdminToken)

export default router;
