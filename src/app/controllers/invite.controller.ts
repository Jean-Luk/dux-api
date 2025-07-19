import { Request, Response, NextFunction } from 'express';
import { InviteService } from '../services/invite.service';

export class InviteController {
    static async list(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await InviteService.list({user:req.user!});

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }

    static async listPending(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await InviteService.listPending({user:req.user!});

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }

    static async send(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await InviteService.send({...req.body, invitor:req.user!, manager:req.manager!});

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }

    static async accept(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await InviteService.accept({...req.body, invitor:req.user!});

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }

    static async decline(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await InviteService.decline({...req.body, invitor:req.user!});

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }

}
