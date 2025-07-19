import { Manager, Prisma, User } from '@prisma/client';
import prisma from '../../config/prisma';
import { AppError } from '../utils/AppError';

interface CreateInterface {
    user: User
}

interface IsManagerInterface {
    userId: string
}

interface GetPermissionsInterface {
    managerId: number
}

interface HasPermissionInterface {
    managerId: number,
    permissionId: number
}

export class ManagerService {
    static async create ({user}: CreateInterface, prismaClient : Prisma.TransactionClient = prisma): Promise<Manager> {
        try {
            // Cria o gestor
            const newManager = await prismaClient.manager.create({
                data:{
                    userId:user.id
                }
            })

            // Busca as permissões
            const permissions = await prismaClient.permission.findMany();

            // Cria todas as permissões com o valor padrão para o gestor
            await Promise.all(
                permissions.map(permission => {
                    prismaClient.managerPermission.create({
                        data:{
                            active:permission.defaultValue,
                            managerId:newManager.id,
                            permissionId:permission.id,
                        }
                    })
                })
            );

            return newManager;

        } catch (error: any) {
            throw new AppError(error.message || 'Erro interno ao criar gestor', error.statusCode || 500);
        }

    }

    static async isManager({userId}: IsManagerInterface): Promise<boolean> {
        try {
            const manager = await prisma.manager.findFirst({where:{userId}})
            return !!manager;
        } catch (error: any) {
            throw new AppError(error.message || 'Erro interno ao verificar se é gestor', error.statusCode || 500);
        }
    }

    static async getPermissions({managerId}: GetPermissionsInterface) {
        try {
            // Busca todas as permissões do gestor especificado
            const permissionsObjects = await prisma.managerPermission.findMany({
                where:{managerId}
            })
            // Transforma num array com apenas as permissões ativas
            const permissionsArray = permissionsObjects.filter(permission => permission.active).map(permission => permission.permissionId);

            return permissionsArray;

        } catch (error: any) {
            throw new AppError(error.message || 'Erro interno ao buscar permissões', error.statusCode || 500);
        }
    }

    static async hasPermission({managerId, permissionId}: HasPermissionInterface) {
        try {
            // Busca a permissão especificada para o gestor
            const permission = await prisma.managerPermission.findFirst({
                where:{managerId, permissionId}
            })
            // Retorna true|false caso tenha achado
            return !!permission

        } catch (error: any) {
            throw new AppError(error.message || 'Erro interno ao buscar permissões', error.statusCode || 500);
        }
    }
}
