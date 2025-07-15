import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { verifyAuth } from '../middlewares/verifyAuth';

const router = Router();

router.post('/login', AuthController.login);
router.post('/register', AuthController.register);
router.get('/me', verifyAuth, AuthController.me);

export default router;
