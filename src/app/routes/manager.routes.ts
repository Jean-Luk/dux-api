import { requireAuth } from '../middlewares/requireAuth';
import { requireManager } from '../middlewares/requireManager';
import { ManagerController } from '../controllers/manager.controller';
import { RouteDefinition } from '../../types';
import { PermissionEnum } from '../../types/enums';
import { Helper } from '../utils/Helper';

const routes: RouteDefinition[] = [
    {
        method:'get',
        path:'/permissions',
        middlewares:[requireAuth, requireManager],
        controller:ManagerController.permissions
    },
    {
        method:'delete',
        path:'/:managerid',
        middlewares:[requireAuth, requireManager],
        requiredPermissions:[PermissionEnum.EDIT_MANAGERS],
        controller:ManagerController.delete
    },
    {
        method:'patch',
        path:'/:managerid/permissions',
        middlewares:[requireAuth, requireManager],
        requiredPermissions:[PermissionEnum.EDIT_PERMISSIONS],
        controller:ManagerController.patchPermissions,
        body:[
            {name:"toAdd", type:"array", possibleValues:Helper.getEnumValues(PermissionEnum)},
            {name:"toRemove", type:"array", possibleValues:Helper.getEnumValues(PermissionEnum)}
        ]
    },
    {
        method:'put',
        path:'/:managerid/permissions',
        middlewares:[requireAuth, requireManager],
        requiredPermissions:[PermissionEnum.EDIT_PERMISSIONS],
        controller:ManagerController.putPermissions,
        body:[
            {name:"permissions", type:"array", possibleValues:Helper.getEnumValues(PermissionEnum), required:true}
        ]
    },
    {
        method:'get',
        path:'/list',
        middlewares:[requireAuth, requireManager],
        requiredPermissions:[PermissionEnum.EDIT_MANAGERS],
        controller:ManagerController.list,
        queryParams:[
            {name:"page", type:"number"},
            {name:"limit", type:"number"},
            {name:"orderField", type:"string", possibleValues:["name", "phone", "email"]},
            {name:"orderDirection", type:"string", possibleValues:["asc", "desc"]},
            {name:"name", type:"string"},
            {name:"email", type:"string"},
            {name:"withPending", type:"boolean"},
            {name:"phone", type:"string"}
        ]
    },
    {
        method:'get',
        path:'/dashboard',
        middlewares:[requireAuth, requireManager],
        controller:ManagerController.getDashboard
    },
    {
        method:'get',
        path:'/:managerid',
        middlewares:[requireAuth, requireManager],
        requiredPermissions:[PermissionEnum.EDIT_MANAGERS],
        controller:ManagerController.getInfo
    },
]

export default routes;
