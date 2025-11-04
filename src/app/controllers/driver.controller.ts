import { Request, Response, NextFunction } from 'express';
import { DriverService } from '../services/driver.service';

export class DriverController {
    static async listLines (req: Request, res: Response, next: NextFunction) {
        try {
            const result = await DriverService.listLines({user:req.user, ...req.parsedQuery});

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }

    static async getLineInfo (req: Request, res: Response, next: NextFunction) {
        try {
            const lineId = req.params.id;

            const result = await DriverService.getLineInfo({lineId, user:req.user!});

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }
}
