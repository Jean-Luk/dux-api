import { NextFunction, Request, Response } from 'express';
import prisma from '../../config/prisma';
import { differenceInMinutes } from 'date-fns';
import { AppError } from '../utils/AppError';
import { RoleEnum } from '../enums';

const SESSION_EXPIRATION_MINUTES = Number(process.env.SESSION_EXPIRATION_MINUTES) || 60;

export async function requireAuth (req: Request, res: Response, next: NextFunction) {    
    try {
        const authToken = req.cookies['dux_auth_token'];

        // Se authToken não existe ou é vazio então retorna um objeto vazio
        if (!authToken || authToken === "") {
            return res.status(401).json({ error: 'Não autenticado' });
        }

        // Procura se existe sessão com o token correspondente
        const session = await prisma.session.findUnique({
            where: { authToken },
            include: {
                login: {
                    include: {
                        user: {
                            include:{
                                manager:{
                                    include:{
                                        permissions:true
                                    }
                                },
                                driver:true,
                                passenger:true
                            }
                        }
                    }
                }
            }
        });

        // Caso não exista sessão ou não exista usuário, retorna status 401
        if (!session || !session.login?.user) {
            return res.status(401).json({ error: 'Não autenticado' });
        }

        // Verifica se a sessão já expirou
        const minutesSinceLastAccess = differenceInMinutes(new Date(), session.lastAccess);
        // Caso já tenha expirado, deleta a sessão e retorna status 401
        if (minutesSinceLastAccess > SESSION_EXPIRATION_MINUTES) {
            await prisma.session.delete({ where: { authToken } });
            return res.status(401).json({ error: 'Não autenticado' });
        }

        // Atualiza o lastAccess da sessão
        await prisma.session.update({
            where: { authToken },
            data: { lastAccess: new Date() }
        });

        const user = session.login.user;
        const roles: RoleEnum[] = [];
        let permissions: number[] = [];
        if (user.manager) {
            roles.push(RoleEnum.MANAGER);

            permissions = user.manager.permissions
                .filter((p) => p.active)
                .map((p) => p.permissionId)
        }

        if (user.driver.length > 0) roles.push(RoleEnum.DRIVER);
        if (user.passenger.length > 0) roles.push(RoleEnum.PASSENGER);
            
        req.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            cpf: user.cpf,
            lastName: user.lastName,
            phone: user.phone,
            roles,
            permissions
        };

        next();
    } catch (error : any) {
        throw new AppError(error.message || 'Erro interno ao verificar login', error.statusCode || 500);
    }
}