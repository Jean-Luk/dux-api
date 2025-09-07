import { Request, Response, NextFunction } from 'express';
import { ManagerService } from '../services/manager.service';

export class ManagerController {
    static async permissions(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await ManagerService.getPermissions({managerId:req.user!.manager!.id});

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }
}
