import { requireAuth } from '../middlewares/requireAuth';
import { RouteDefinition } from '../../types';
import { SessionController } from '../controllers/session.controller';

const routes: RouteDefinition[] = [
    {
        method:'post',
        path:'',
        controller:SessionController.login,
        body: [
            {name:"login", type:"string", required:true},
            {name:"password", type:"string", required:true},
        ]
    },
    {
        method:'get',
        path:'',
        middlewares:[requireAuth],
        controller:SessionController.me
    },
    {
        method:'delete',
        path:'',
        controller:SessionController.logout
    },
]
export default routes;
