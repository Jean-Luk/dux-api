import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { AppError } from '../utils/AppError';

export class AuthController {
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

    static async login(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.body || typeof req.body !== 'object') {
                throw new AppError('Corpo da requisição inválido ou ausente', 400);
            }
       
            const result = await AuthService.login(req.body);

            res.status(200).cookie('dux_auth_token', result.authToken, {
                httpOnly: true,
                secure: process.env.ENVIRONMENT === "PROD",
                sameSite: 'strict',
                maxAge: 1000 * 60 * 60 * 24 // 1 dia
            }).end();

        } catch (err) {
            next(err);
        }
    }

    static async me(req: Request, res: Response, next: NextFunction) {
        try {
            const result = req.user ?? {};

            res.status(200).json(result);

        } catch (err) {
            next(err);
        }
    }

}
