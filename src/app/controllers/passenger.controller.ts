import { Request, Response, NextFunction } from 'express';
import { PassengerService } from '../services/passenger.service';

export class PassengerController {
    static async listLines (req: Request, res: Response, next: NextFunction) {
        try {
            const result = await PassengerService.listLines({user:req.user, ...req.parsedQuery});

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }
    
    static async updateCheckinPoints (req: Request, res: Response, next: NextFunction) {
        try {
            const lineId = req.params.lineid;

            const result = await PassengerService.updateCheckinPoints({user:req.user!, lineId, ...req.body});

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }

    static async getLineInfo (req: Request, res: Response, next: NextFunction) {
        try {
            const lineId = req.params.lineid;

            const result = await PassengerService.getLineInfo({lineId, user:req.user!});

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }

    static async putCheckin (req: Request, res: Response, next: NextFunction) {
        try {
            const lineId = req.params.lineid;

            const result = await PassengerService.putCheckin({lineId, user:req.user!, ...req.body});

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }

    static async getCardInfo (req: Request, res: Response, next: NextFunction) {
        try {
            const lineId = req.params.lineid;

            const result = await PassengerService.getCardInfo({lineId, user:req.user!});

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }

    static async getPassengerLineDocuments (req: Request, res: Response, next: NextFunction) {
        try {
            const lineId = req.params.lineid;

            const result = await PassengerService.getPassengerLineDocuments({lineId, user:req.user!});

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }

    static async getPassengerDocuments (req: Request, res: Response, next: NextFunction) {
        try {
            const result = await PassengerService.getPassengerDocuments({user:req.user!});

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }

    static async getPassengerDocument (req: Request, res: Response, next: NextFunction) {
        try {
            const documentId = Number(req.params.documentid);

            const result = await PassengerService.getPassengerDocument({documentId, user:req.user!});

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }

    static async getLinePoints (req: Request, res: Response, next: NextFunction) {
        try {
            const lineId = req.params.lineid;

            const result = await PassengerService.getLinePoints({lineId, user:req.user!});

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }
}
