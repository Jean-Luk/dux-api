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

    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            // TODO: Adicionar middleware de validação dos params da url
            const deletedId = isNaN(Number(req.params.id)) ? -1 : Number(req.params.id);

            const result = await ManagerService.delete({managerId:req.user!.manager!.id, deletedId});

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }

    static async patchPermissions(req: Request, res: Response, next: NextFunction) {
        try {
            // TODO: Adicionar middleware de validação dos params da url
            const updatedManagerId = isNaN(Number(req.params.id)) ? -1 : Number(req.params.id);

            const result = await ManagerService.patchPermissions({managerId:req.user!.manager!.id, updatedManagerId, ...req.body});

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }

    static async putPermissions(req: Request, res: Response, next: NextFunction) {
        try {
            // TODO: Adicionar middleware de validação dos params da url
            const updatedManagerId = isNaN(Number(req.params.id)) ? -1 : Number(req.params.id);

            const result = await ManagerService.putPermissions({managerId:req.user!.manager!.id, updatedManagerId, ...req.body});

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }

    static async list(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await ManagerService.list(req.parsedQuery!);

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }

    static async getInfo(req: Request, res: Response, next: NextFunction) {
        try {
            // TODO: Adicionar middleware de validação dos params da url
            const managerId = isNaN(Number(req.params.id)) ? -1 : Number(req.params.id);

            const result = await ManagerService.getInfo({managerId});

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }
}
