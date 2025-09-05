import { InviteController } from '../controllers/invite.controller';
import { requireAuth } from '../middlewares/requireAuth';
import { requireManager } from '../middlewares/requireManager';
import { RouteDefinition } from '../../types';
import { RoleEnum } from '../enums';

const routes: RouteDefinition[] = [
    {
        method:'get',
        path:'',
        middlewares:[requireAuth],
        controller:InviteController.list,
    },
    {
        method:'get',
        path:'/pending',
        middlewares:[requireAuth],
        controller:InviteController.listPending,
    },
    {
        method:'post',
        path:'',
        middlewares:[requireAuth, requireManager],
        controller:InviteController.send,
        body: [
            {name:"invitedEmail", type:"string", required:true},
            {name:"role", type:"string", required:true, possibleValues:[RoleEnum.MANAGER, RoleEnum.DRIVER, RoleEnum.PASSENGER]},
            {name:"lineId", type:"string", required:false},
        ]
    },
    {
        method:'put',
        path:'/:id/accept',
        middlewares:[requireAuth],
        controller:InviteController.accept,
    },
    {
        method:'put',
        path:'/:id/decline',
        middlewares:[requireAuth],
        controller:InviteController.decline,
    },
    {
        method:'delete',
        path:'/:id',
        middlewares:[requireAuth, requireManager],
        controller:InviteController.delete,
    },
]

export default routes;
