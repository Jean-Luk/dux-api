import { Router } from 'express';
import { requireAuth } from '../middlewares/requireAuth';
import { requireManager } from '../middlewares/requireManager';
import { ManagerController } from '../controllers/manager.controller';

const router = Router();

router.get('/permissions', requireAuth, requireManager, ManagerController.permissions);

export default router;
