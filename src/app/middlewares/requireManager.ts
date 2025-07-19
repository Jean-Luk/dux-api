import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError';
import prisma from '../../config/prisma';

export async function requireManager (req: Request, res: Response, next: NextFunction) {    
    try {
        const user = req.user;

        // Busca instância de manager para o usuário e caso não exista retorna erro
        const manager = await prisma.manager.findUnique({where:{userId:user!.id}});
        if(!manager) {
            return res.status(403).json({ error: 'Não autorizado' });
        }

        req.manager = manager;
        
        next();
    } catch (error : any) {
        throw new AppError(error.message || 'Erro interno ao verificar gestor', error.statusCode || 500);
    }
}