import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError';
import { RoleEnum } from '../../types/enums';

export async function requireDriver (req: Request, res: Response, next: NextFunction) {    
    try {
        const user = req.user;

        if(!user || !user.roles.includes(RoleEnum.DRIVER)) {
            throw new AppError(`Não autorizado`, 403)
        }
        
        next();
    } catch (error : any) {
        throw new AppError(error.message || 'Erro interno ao verificar motorista', error.statusCode || 500);
    }
}