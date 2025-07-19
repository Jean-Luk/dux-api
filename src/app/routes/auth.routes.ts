import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { requireAuth } from '../middlewares/requireAuth';
import { validateBody } from '../middlewares/validateBody';

const router = Router();

router.post('/login', validateBody, AuthController.login);
router.post('/register', validateBody, AuthController.register);
router.get('/me', requireAuth, AuthController.me);
router.delete('/logout', AuthController.logout);

export default router;
