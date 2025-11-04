import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError';
import { RoleEnum } from '../../types/enums';

export async function requirePassenger (req: Request, res: Response, next: NextFunction) {    
    try {
        const user = req.user;

        if(!user || !user.roles.includes(RoleEnum.PASSENGER)) {
            throw new AppError(`Não autorizado`, 403)
        }
        
        next();
    } catch (error : any) {
        throw new AppError(error.message || 'Erro interno ao verificar passageiro', error.statusCode || 500);
    }
}