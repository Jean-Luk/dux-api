import { UserController } from '../controllers/user.controller';
import { RouteDefinition } from '../../types/RouteDefinition';

const routes: RouteDefinition[] = [
    {
        method:'post',
        path:'',
        controller:UserController.register,
        body: [
            {name:"email",    type:"string", required:true},
            {name:"cpf",      type:"string", required:true},
            {name:"name",     type:"string", required:true},
            {name:"lastName", type:"string", required:true},
            {name:"phone",    type:"string", required:true},
            {name:"password", type:"string", required:true},
        ]
    }
]
export default routes;
