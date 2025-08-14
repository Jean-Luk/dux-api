import { Request, Response, NextFunction } from 'express';
import { LineService } from '../services/line.service';

export class LineController {
    static async list(req: Request, res: Response, next: NextFunction) {
        try {
            const page = !isNaN(Number(req.query.page)) ? Number(req.query.page) : undefined;
            const limit = !isNaN(Number(req.query.limit)) ? Number(req.query.limit) : undefined;
            const orderField = typeof req.query.orderField === 'string' ? req.query.orderField : undefined;
            const orderDirection = typeof req.query.orderDirection === 'string' ? req.query.orderDirection : undefined;
            const status = typeof req.query.status === 'string' ? req.query.status : undefined;
            const name = typeof req.query.name === 'string' ? req.query.name : undefined;

            const result = await LineService.list({page, limit, orderField, orderDirection, status, name});

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }

    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await LineService.create(req.body);

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }

    static async getInfo(req: Request, res: Response, next: NextFunction) {
        try {
            const lineId = req.params.id;
            const result = await LineService.getInfo({lineId});

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }

    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            const lineId = req.params.id;
            const result = await LineService.update({lineId, ...req.body});

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }

    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const lineId = req.params.id;
            await LineService.delete({lineId});

            res.status(204).send();
        } catch (err) {
            next(err);
        }
    }

    /** Points functions: */
    static async getPoints(req: Request, res: Response, next: NextFunction) {
        try {
            const lineId = req.params.id;
            const result = await LineService.getPoints({lineId});

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }
    static async createPoint(req: Request, res: Response, next: NextFunction) {
        try {
            const lineId = req.params.id;
            const result = await LineService.createPoint({lineId, ...req.body});

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }
    static async updatePoint(req: Request, res: Response, next: NextFunction) {
        try {
            const lineId = req.params.lineid;
            const pointId = Number(req.params.pointid);
            const result = await LineService.updatePoint({lineId, pointId, ...req.body});

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }
    static async deletePoint(req: Request, res: Response, next: NextFunction) {
        try {
            const lineId = req.params.lineid;
            const pointId = Number(req.params.pointid);
            await LineService.deletePoint({lineId, pointId});

            res.status(204).send();            
        } catch (err) {
            next(err);
        }
    }

    /** Drivers functions */
    static async getDrivers(req: Request, res: Response, next: NextFunction) {
        try {
            const lineId = req.params.id;

            const status = typeof req.query.status === 'string' ? req.query.status : undefined;
            const name = typeof req.query.name === 'string' ? req.query.name : undefined;

            const result = await LineService.getDrivers({lineId, status, name});

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }
    static async getPendingDrivers(req: Request, res: Response, next: NextFunction) {
        try {
            const lineId = req.params.id;

            const result = await LineService.getPendingDrivers({lineId});

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }
    static async updateDriver(req: Request, res: Response, next: NextFunction) {
        try {
            const lineId = req.params.lineid;
            const driverId = Number(req.params.driverid);
            const result = await LineService.updateDriver({lineId, driverId, ...req.body});

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }
    static async deleteDriver(req: Request, res: Response, next: NextFunction) {
        try {
            const lineId = req.params.lineid;
            const driverId = Number(req.params.driverid);
            await LineService.deleteDriver({lineId, driverId});

            res.status(204).send();            
        } catch (err) {
            next(err);
        }
    }

}
