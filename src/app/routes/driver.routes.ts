import { RouteDefinition } from '../../types';
import { DriverController } from '../controllers/driver.controller';
import { requireAuth } from '../middlewares/requireAuth';
import { requireDriver } from '../middlewares/requireDriver';


const routes: RouteDefinition[] = [
    {
        method:'get',
        path:'/lines',
        middlewares:[requireAuth, requireDriver],
        controller:DriverController.listLines,
        queryParams:[
            {name:"page", type:"number"},
            {name:"limit", type:"number"},
            {name:"orderField", type:"string", possibleValues:["name", "active", "departureTime"]},
            {name:"orderDirection", type:"string", possibleValues:["asc", "desc"]},
            {name:"status", type:"string", possibleValues:["active", "unactive"]},
            {name:"name", type:"string"}
        ]
    },
    {
        method:'get',
        path:'/line/:id',
        middlewares:[requireAuth, requireDriver],
        controller:DriverController.getLineInfo,
    },
    {
        method:'get',
        path:'/lines/:lineId/points/checkins',
        middlewares:[requireAuth, requireDriver],
        controller:DriverController.getLinePointCheckins
    }
]

export default routes;
