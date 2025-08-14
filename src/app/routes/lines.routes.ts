import { RouteDefinition } from '../../types/RouteDefinition';
import { LineController } from '../controllers/line.controller';
import { PointFlavorEnum, StatusEnum } from '../enums';
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
    {
        method:'get',
        path:'/:id/points',
        middlewares:[requireAuth, requireManager],
        controller:LineController.getPoints,
    },
    {
        method:'post',
        path:'/:id/points',
        middlewares:[requireAuth, requireManager],
        controller:LineController.createPoint,
        body: [
            {name:"address", required:true, type:"string"},
            {name:"flavor", required:true, type:"string", possibleValues:[PointFlavorEnum.BOARDING_POINT, PointFlavorEnum.DESTINY_POINT, PointFlavorEnum.DROPOFF_POINT]},
            {name:"latitude", required:true, type:"number"},
            {name:"longitude", required:true, type:"number"},
            {name:"sequencePosition", required:true, type:"number"},
        ]
    },
    {
        method:'patch',
        path:'/:lineid/points/:pointid',
        middlewares:[requireAuth, requireManager],
        controller:LineController.updatePoint,
        body: [
            {name:"address", required:false, type:"string"},
            {name:"flavor", required:false, type:"string", possibleValues:[PointFlavorEnum.BOARDING_POINT, PointFlavorEnum.DESTINY_POINT, PointFlavorEnum.DROPOFF_POINT]},
            {name:"latitude", required:false, type:"number"},
            {name:"longitude", required:false, type:"number"},
            {name:"sequencePosition", required:false, type:"number"},
        ]
    },
    {
        method:'delete',
        path:'/:lineid/points/:pointid',
        middlewares:[requireAuth, requireManager],
        controller:LineController.deletePoint,
    },
    {
        method:'get',
        path:'/:id/drivers',
        middlewares:[requireAuth, requireManager],
        controller:LineController.getDrivers,
    },
    {
        method:'get',
        path:'/:id/pendingDrivers',
        middlewares:[requireAuth, requireManager],
        controller:LineController.getPendingDrivers,
    },
    {
        method:'patch',
        path:'/:lineid/drivers/:driverid',
        middlewares:[requireAuth, requireManager],
        controller:LineController.updateDriver,
        body: [
            {name:"status", required:true, type:"string", possibleValues:[StatusEnum.ACTIVE, StatusEnum.UNACTIVE]},
        ]
    },
    {
        method:'delete',
        path:'/:lineid/drivers/:driverid',
        middlewares:[requireAuth, requireManager],
        controller:LineController.deleteDriver,
    },
]

export default routes;
