import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError';
import { PermissionEnum } from '../enums';

export function requirePermission (requiredPermissions: PermissionEnum[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            const userPermissions = req.user?.permissions;

            if(!userPermissions) {
                throw new AppError(`Não autorizado`, 403);
            }

            for (const requiredPermission of requiredPermissions) {
                if (!userPermissions.includes(requiredPermission)) {
                    throw new AppError(`Não autorizado`, 403);
                }
            }
            
            next();
        } catch (error : any) {
            throw new AppError(error.message || 'Erro interno ao verificar gestor', error.statusCode || 500);
        }
    }
}