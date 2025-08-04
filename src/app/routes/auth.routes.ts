import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { requireAuth } from '../middlewares/requireAuth';
import { validateBody } from '../middlewares/validateBody';
import { RouteDefinition } from '../../types/RouteDefinition';

const routes: RouteDefinition[] = [
    {
        method:'post',
        path:'/login',
        controller:AuthController.login,
        body: [
            {name:"login", type:"string", required:true},
            {name:"password", type:"string", required:true},
        ]
    },
    {
        method:'post',
        path:'/register',
        controller:AuthController.register,
        body: [
            {name:"email",    type:"string", required:true},
            {name:"cpf",      type:"string", required:true},
            {name:"name",     type:"string", required:true},
            {name:"lastName", type:"string", required:true},
            {name:"phone",    type:"string", required:true},
            {name:"password", type:"string", required:true},
        ]
    },
    {
        method:'get',
        path:'/me',
        middlewares:[requireAuth],
        controller:AuthController.me
    },
    {
        method:'delete',
        path:'/logout',
        controller:AuthController.logout
    },
]
export default routes;
