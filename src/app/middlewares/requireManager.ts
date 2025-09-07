import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError';

export async function requireManager (req: Request, res: Response, next: NextFunction) {    
    try {
        const user = req.user;

        if(!user || !user.manager) {
            throw new AppError(`Não autorizado`, 403)
        }
        
        next();
    } catch (error : any) {
        throw new AppError(error.message || 'Erro interno ao verificar gestor', error.statusCode || 500);
    }
}