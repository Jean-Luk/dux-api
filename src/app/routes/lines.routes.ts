import { RouteDefinition } from '../../types';
import { LineController } from '../controllers/line.controller';
import { PermissionEnum, PointFlavorEnum, StatusEnum, CardStatusEnum } from '../../types/enums';
import { requireAuth } from '../middlewares/requireAuth';
import { requireManager } from '../middlewares/requireManager';
import { handleFileUpload } from '../middlewares/handleFileUpload';


const routes: RouteDefinition[] = [
    {
        method:'get',
        path:'',
        middlewares:[requireAuth, requireManager],
        controller:LineController.list,
        queryParams:[
            {name:"page", type:"number"},
            {name:"limit", type:"number"},
            {name:"orderField", type:"string", possibleValues:["name", "active", "departureTime", "billDueDate"]},
            {name:"orderDirection", type:"string", possibleValues:["asc", "desc"]},
            {name:"status", type:"string", possibleValues:["active", "unactive"]},
            {name:"name", type:"string"}
        ]
    },    
    {
        method:'get',
        path:'/:lineid',
        middlewares:[requireAuth, requireManager],
        controller:LineController.getInfo,
    },
    {
        method:'post',
        path:'',
        middlewares:[requireAuth, requireManager],
        requiredPermissions:[PermissionEnum.OPERATE_LINES],
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
        path:'/:lineid',
        middlewares:[requireAuth, requireManager],
        requiredPermissions:[PermissionEnum.OPERATE_LINES],
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
        path:'/:lineid',
        middlewares:[requireAuth, requireManager],
        requiredPermissions:[PermissionEnum.OPERATE_LINES],
        controller:LineController.delete,
    },
    {
        method:'get',
        path:'/:lineid/points',
        middlewares:[requireAuth, requireManager],
        controller:LineController.getPoints,
    },
    {
        method:'post',
        path:'/:lineid/points',
        middlewares:[requireAuth, requireManager],
        requiredPermissions:[PermissionEnum.OPERATE_LINES],
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
        requiredPermissions:[PermissionEnum.OPERATE_LINES],
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
        requiredPermissions:[PermissionEnum.OPERATE_LINES],
        middlewares:[requireAuth, requireManager],
        controller:LineController.deletePoint,
    },
    {
        method:'get',
        path:'/:lineid/drivers',
        middlewares:[requireAuth, requireManager],
        queryParams:[
            {name:"withPending", type:"boolean"},
            {name:"status", type:"string"},
            {name:"name", type:"string"}
        ],
        controller:LineController.getDrivers,
    },
    {
        method:'get',
        path:'/:lineid/pendingDrivers',
        queryParams:[
            {name:"name", type:"string"}
        ],
        middlewares:[requireAuth, requireManager],
        controller:LineController.getPendingDrivers,
    },
    {
        method:'patch',
        path:'/:lineid/drivers/:driverid',
        middlewares:[requireAuth, requireManager],
        requiredPermissions:[PermissionEnum.EDIT_DRIVERS],
        controller:LineController.updateDriver,
        body: [
            {name:"status", required:true, type:"string", possibleValues:[StatusEnum.ACTIVE, StatusEnum.UNACTIVE]},
        ]
    },
    {
        method:'delete',
        path:'/:lineid/drivers/:driverid',
        requiredPermissions:[PermissionEnum.EDIT_DRIVERS],
        middlewares:[requireAuth, requireManager],
        controller:LineController.deleteDriver,
    },
    {
        method:'get',
        path:'/:lineid/passengers',
        queryParams:[
            {name:"withPending", type:"boolean"},
            {name:"status", type:"string"},
            {name:"name", type:"string"}
        ],
        middlewares:[requireAuth, requireManager],
        controller:LineController.getPassengers,
    },
    {
        method:'get',
        path:'/:lineid/pendingPassengers',
        queryParams:[
            {name:"name", type:"string"}
        ],
        middlewares:[requireAuth, requireManager],
        controller:LineController.getPendingPassengers,
    },
    {
        method:'patch',
        path:'/:lineid/passengers/:passengerid',
        requiredPermissions:[PermissionEnum.EDIT_PASSENGERS],
        middlewares:[requireAuth, requireManager],
        controller:LineController.updatePassenger,
        body: [
            {name:"status", required:false, type:"string", possibleValues:[StatusEnum.ACTIVE, StatusEnum.UNACTIVE]},
            {name:"cardStatus", required:false, type:"string", possibleValues:[CardStatusEnum.WHITE, CardStatusEnum.RED, CardStatusEnum.GREEN]},
        ]
    },
    {
        method:'delete',
        path:'/:lineid/passengers/:passengerid',
        requiredPermissions:[PermissionEnum.EDIT_PASSENGERS],
        middlewares:[requireAuth, requireManager],
        controller:LineController.deletePassenger,
    },
    {
        method:'post',
        path:'/:lineid/passengers/:passengerid/document',
        requiredPermissions:[PermissionEnum.OPERATE_DOCUMENTS],
        middlewares:[requireAuth, requireManager, handleFileUpload],
        controller:LineController.postPassengerDocument,
        body:[
            {name:"title", type:"string", required:true}
        ]
    },
    {
        method:'get',
        path:'/:lineid/passengers/:passengerid/document/:documentid',
        middlewares:[requireAuth, requireManager],
        controller:LineController.getPassengerDocument,
    },
    {
        method:'delete',
        path:'/:lineid/passengers/:passengerid/document/:documentid',
        middlewares:[requireAuth, requireManager],
        requiredPermissions:[PermissionEnum.OPERATE_DOCUMENTS],
        controller:LineController.deletePassengerDocument,
    },
    {
        method:'get',
        path:'/:lineid/passengers/:passengerid/documents/',
        middlewares:[requireAuth, requireManager],
        controller:LineController.getPassengerDocuments,
    }

]

export default routes;
