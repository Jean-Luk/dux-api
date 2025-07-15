import { NextFunction, Request, Response } from 'express';
import prisma from '../../config/prisma';
import { differenceInMinutes } from 'date-fns';
import { AppError } from '../utils/AppError';

const SESSION_EXPIRATION_MINUTES = Number(process.env.SESSION_EXPIRATION_MINUTES) || 60;

export async function verifyAuth (req: Request, res: Response, next: NextFunction) {    
    try {
        const authToken = req.cookies['dux_auth_token'];

        // Se authToken não existe ou é vazio então retorna um objeto vazio
        if (!authToken || authToken === "") {
            return res.status(401).json({ error: 'Não autorizado' });
        }

        // Procura se existe sessão com o token correspondente
        const session = await prisma.session.findUnique({
            where: { authToken },
            include: {
                login: {
                    include: {
                        user: true
                    }
                }
            }
        });

        // Caso não exista sessão ou não exista usuário, retorna status 401
        if (!session || !session.login?.user) {
            return res.status(401).json({ error: 'Não autorizado' });
        }

        // Verifica se a sessão já expirou
        const minutesSinceLastAccess = differenceInMinutes(new Date(), session.lastAccess);
        // Caso já tenha expirado, deleta a sessão e retorna status 401
        if (minutesSinceLastAccess > SESSION_EXPIRATION_MINUTES) {
            await prisma.session.delete({ where: { authToken } });
            return res.status(401).json({ error: 'Não autorizado' });
        }

        // Atualiza o lastAccess da sessão
        await prisma.session.update({
            where: { authToken },
            data: { lastAccess: new Date() }
        });

        req.user = session.login.user;

        next();
    } catch (error : any) {
        throw new AppError(error.message || 'Erro interno ao realizar login', error.statusCode || 500);
    }
}