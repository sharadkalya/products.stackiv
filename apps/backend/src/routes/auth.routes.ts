import { Router, Router as ExpressRouter } from 'express';

import { login, loginViaGoogle, logout, signup, getCurrentUser } from '../controllers/auth.controller';
import { authenticateJWT } from '../middleware/jwt.middleware';

const router: ExpressRouter = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/loginViaGoogle', loginViaGoogle);
router.post('/logout', logout);
router.get('/me', authenticateJWT, getCurrentUser);

export default router;