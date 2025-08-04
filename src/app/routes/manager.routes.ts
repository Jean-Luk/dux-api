import { requireAuth } from '../middlewares/requireAuth';
import { requireManager } from '../middlewares/requireManager';
import { ManagerController } from '../controllers/manager.controller';
import { RouteDefinition } from '../../types/RouteDefinition';

const routes: RouteDefinition[] = [
    {
        method:'get',
        path:'/permissions',
        middlewares:[requireAuth, requireManager],
        controller:ManagerController.permissions
    }
]

export default routes;
