import { Router } from 'express';
import { InviteController } from '../controllers/invite.controller';
import { requireAuth } from '../middlewares/requireAuth';
import { validateBody } from '../middlewares/validateBody';
import { requireManager } from '../middlewares/requireManager';
import { RouteDefinition } from '../../types/RouteDefinition';

const routes: RouteDefinition[] = [
    {
        method:'get',
        path:'/list',
        middlewares:[requireAuth],
        controller:InviteController.list,
    },
    {
        method:'get',
        path:'/listPending',
        middlewares:[requireAuth],
        controller:InviteController.listPending,
    },
    {
        method:'post',
        path:'/send',
        middlewares:[requireAuth, requireManager],
        controller:InviteController.send,
        body: [
            {name:"invitedEmail", type:"string", required:true},
            {name:"role", type:"string", required:true, possibleValues:["M", "D", "P"]},
            {name:"lineId", type:"string", required:false},
        ]
    },
    {
        method:'put',
        path:'/accept',
        middlewares:[requireAuth],
        controller:InviteController.accept,
        body: [
            {name:"inviteId", type:"string", required:true}
        ]
    },
    {
        method:'delete',
        path:'/decline',
        middlewares:[requireAuth],
        controller:InviteController.decline,
        body: [
            {name:"inviteId", type:"string", required:true}
        ]
    },
]

export default routes;
