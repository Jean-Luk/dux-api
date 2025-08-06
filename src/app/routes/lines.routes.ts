import { RouteDefinition } from '../../types/RouteDefinition';
import { LineController } from '../controllers/line.controller';
import { requireAuth } from '../middlewares/requireAuth';
import { requireManager } from '../middlewares/requireManager';


const routes: RouteDefinition[] = [
    {
        method:'get',
        path:'',
        middlewares:[requireAuth, requireManager],
        controller:LineController.list,
    },
    {
        method:'get',
        path:'/:id',
        middlewares:[requireAuth, requireManager],
        controller:LineController.getInfo,
    },
    {
        method:'post',
        path:'',
        middlewares:[requireAuth, requireManager],
        controller:LineController.create,
        body:[
            {name:"name", type:"string", required:true},
            {name:"departureTime", type:"string", required:true},
            {name:"weekdays", type:"array", required:true, possibleValues:[0,1,2,3,4,5,6]},
            {name:"active", type:"boolean", required:false},
        ]
    },
    {
        method:'patch',
        path:'/:id',
        middlewares:[requireAuth, requireManager],
        controller:LineController.update,
        body:[
            {name:"name", type:"string", required:false},
            {name:"departureTime", type:"string", required:false},
            {name:"weekdays", type:"array", required:false, possibleValues:[0,1,2,3,4,5,6]},
            {name:"active", type:"boolean", required:false},
            {name:"billDueDate", type:"number", required:false},
        ]
    },
    {
        method:'delete',
        path:'/:id',
        middlewares:[requireAuth, requireManager],
        controller:LineController.delete,
    },
]

export default routes;
