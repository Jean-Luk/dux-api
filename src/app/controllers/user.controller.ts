import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { AppError } from '../utils/AppError';

export class UserController {
    static async register(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.body || typeof req.body !== 'object') {
                throw new AppError('Corpo da requisição inválido ou ausente', 400);
            }
       
            const result = await AuthService.register(req.body);
    
            res.status(201).json(result);

        } catch (err) {
            next(err);
        }
    }
}
