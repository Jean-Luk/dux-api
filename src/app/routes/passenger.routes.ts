import { RouteDefinition } from '../../types';
import { PassengerController } from '../controllers/passenger.controller';
import { requireAuth } from '../middlewares/requireAuth';
import { requirePassenger } from '../middlewares/requirePassenger';


const routes: RouteDefinition[] = [
    {
        method:'get',
        path:'/lines',
        middlewares:[requireAuth, requirePassenger],
        controller:PassengerController.listLines,
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
        method:'patch',
        path:'/checkinPoints',
        middlewares:[requireAuth, requirePassenger],
        controller:PassengerController.updateCheckinPoints,
        body: [
            {name:"boardingPoint", required:false, type:"number"},
            {name:"destinyPoint", required:false, type:"number"},
            {name:"dropoffPoint", required:false, type:"number"},
            {name:"lineId", required:true, type:"string"}
        ]
    },
    {
        method:'get',
        path:'/line/:id',
        middlewares:[requireAuth, requirePassenger],
        controller:PassengerController.getLineInfo,
    },
    {
        method:'put',
        path:'/line/:id/checkin',
        middlewares:[requireAuth, requirePassenger],
        controller:PassengerController.putCheckin,
        body: [
            {name:"checked", required:true, type:"boolean"}
        ]
    },
    {
        method:'patch',
        path:'/line/:id/checkinPoints',
        middlewares:[requireAuth, requirePassenger],
        controller:PassengerController.updateCheckinPoints,
        body: [
            {name:"boardingPointId", required:false, type:"number"},
            {name:"destinyPointId", required:false, type:"number"},
            {name:"dropoffPointId", required:false, type:"number"}
        ]
    },
    {
        method:'get',
        path:'/line/:id/card',
        middlewares:[requireAuth, requirePassenger],
        controller:PassengerController.getCardInfo
    },
]

export default routes;
