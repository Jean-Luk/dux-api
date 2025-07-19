import { Router } from 'express';
import { InviteController } from '../controllers/invite.controller';
import { requireAuth } from '../middlewares/requireAuth';
import { validateBody } from '../middlewares/validateBody';
import { requireManager } from '../middlewares/requireManager';

const router = Router();

router.get('/list', requireAuth, InviteController.list);
router.get('/listPending', requireAuth, InviteController.listPending);
router.post('/send', requireAuth, requireManager, validateBody, InviteController.send);
router.put('/accept', requireAuth, validateBody, InviteController.accept);
router.delete('/decline', requireAuth, validateBody, InviteController.decline);

export default router;
