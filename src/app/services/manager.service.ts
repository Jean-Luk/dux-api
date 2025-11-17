import { Manager, Prisma, User } from '@prisma/client';
import prisma from '../../config/prisma';
import { AppError } from '../utils/AppError';
import { PermissionEnum, RoleEnum } from '../../types/enums';

interface CreateInterface {
    user: User;
}

interface IsManagerInterface {
    userId: string;
}

interface GetPermissionsInterface {
    managerId: number;
}

interface HasPermissionInterface {
    managerId: number;
    permissionId: number
}

interface DeleteInterface {
    managerId: number;
    deletedId: number;
}

interface PatchPermissionsInterface {
    managerId: number;
    updatedManagerId: number;
    toRemove?: PermissionEnum[];
    toAdd?: PermissionEnum[];
}
interface PutPermissionsInterface {
    managerId: number;
    updatedManagerId: number;
    permissions: PermissionEnum[];
}

interface ListInterface {
    page?: number;
    limit?: number;
    orderField?: "name"|"phone"|"email";
    orderDirection?: "asc"|"desc";
    name?: string;
    withPending?: boolean;
}
interface GetPendingManagersInterface {
    name?: string;
}

interface GetInfoInterface {
    managerId: number;
}

export class ManagerService {
    static async create ({user}: CreateInterface, prismaClient : Prisma.TransactionClient = prisma): Promise<Manager|false> {
        try {

            // Retorna false caso usuário especificado já seja um gestor
            if(await this.isManager({userId:user.id})) {
                return false;
            }

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
                    return prismaClient.managerPermission.create({
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

    static async delete({managerId, deletedId}: DeleteInterface) {
        try {
            // Verifica se está tentando remover a si mesmo como gestor
            if(managerId === deletedId) {
                throw new AppError("Não é possível remover a si mesmo", 422);
            }

            // Verifica se manager especificado existe
            const deletedManager = await prisma.manager.findUnique({
                where:{id:deletedId}
            })
            if(!deletedManager) {
                throw new AppError("Gestor inexistente", 404)
            }

            // Remove o gestor e as permissões dele (via cascade)
            await prisma.manager.delete({
                where:{id:deletedId}
            })
            
        } catch (error: any) {
            throw new AppError(error.message || 'Erro interno ao remover gestor', error.statusCode || 500);
        }
    }

    static async patchPermissions({managerId, updatedManagerId, toRemove, toAdd}: PatchPermissionsInterface) {
        try {
            // Verifica se está tentando atualizar as próprias permissões
            if(managerId === updatedManagerId) {
                throw new AppError("Não é possível atualizar as próprias permissões", 422);
            }

            // Verifica se manager especificado existe
            const updatedManager = await prisma.manager.findUnique({
                where:{id:updatedManagerId}
            })
            if(!updatedManager) {
                throw new AppError("Gestor inexistente", 404)
            }

            // Busca as permissões atuais:
            const currentPermissions = await this.getPermissions({managerId:updatedManagerId});

            // Roda um updatemany caso possuam permissões para ativar
            if (toAdd && toAdd.length > 0) {
                await prisma.managerPermission.updateMany({
                    where:{
                        managerId:updatedManagerId,
                        permissionId: { in: toAdd.filter(p => !currentPermissions.includes(p))}
                    },
                    data:{
                        active:true
                    }
                })
            }
            // Roda um updatemany caso possuam permissões para desativar
            if (toRemove && toRemove.length > 0) {
                await prisma.managerPermission.updateMany({
                    where:{
                        managerId:updatedManagerId,
                        permissionId: { in: toRemove.filter(p => currentPermissions.includes(p))}
                    },
                    data:{
                        active:false
                    }
                })
            }
            
            const updatedPermissions = await this.getPermissions({managerId:updatedManagerId});
            return updatedPermissions

        } catch (error: any) {
            throw new AppError(error.message || 'Erro interno ao atualizar permissões', error.statusCode || 500);
        }
    }

    static async putPermissions({managerId, updatedManagerId, permissions}: PutPermissionsInterface) {
        try {
            // Verifica se está tentando atualizar as próprias permissões
            if(managerId === updatedManagerId) {
                throw new AppError("Não é possível atualizar as próprias permissões", 422);
            }

            // Verifica se manager especificado existe
            const updatedManager = await prisma.manager.findUnique({
                where:{id:updatedManagerId}
            })

            if(!updatedManager) {
                throw new AppError("Gestor inexistente", 404)
            }

            // Busca as permissões atuais:
            const currentPermissions = await this.getPermissions({managerId:updatedManagerId});

            const toAdd = permissions.filter((p) => !currentPermissions.includes(p));
            const toRemove = currentPermissions.filter((p) => !permissions.includes(p));

            // Roda um updatemany caso possuam permissões para ativar
            if (toAdd && toAdd.length > 0) {
                await prisma.managerPermission.updateMany({
                    where:{
                        managerId:updatedManagerId,
                        permissionId: { in: toAdd.filter(p => !currentPermissions.includes(p))}
                    },
                    data:{
                        active:true
                    }
                })
            }

            // Roda um updatemany caso possuam permissões para desativar
            if (toRemove && toRemove.length > 0) {
                await prisma.managerPermission.updateMany({
                    where:{
                        managerId:updatedManagerId,
                        permissionId: { in: toRemove.filter(p => currentPermissions.includes(p))}
                    },
                    data:{
                        active:false
                    }
                })
            }
            
            const updatedPermissions = await this.getPermissions({managerId:updatedManagerId});
            return updatedPermissions

        } catch (error: any) {
            throw new AppError(error.message || 'Erro interno ao atualizar permissões', error.statusCode || 500);
        }
    }

    static async list({page=1, limit=10, orderField='name', orderDirection='asc', name, withPending=false}: ListInterface) {
        try {

            if(page < 1 || limit < 1) {
                throw new AppError("Argumentos de paginação inválidos");
            }

            const skip = (page - 1) * limit;
            // Tratativa para incluir o sobrenome caso esteja ordenando pelo 'name'
            const orderBy = orderField === 'name' ? [{user:{ name: orderDirection}}, {user:{lastName:orderDirection }}] : [{user:{ [orderField]: orderDirection }}]

            const managers = await prisma.manager.findMany({
                skip,
                take: limit,
                orderBy,
                where:{
                    ...(name && {user:{
                        OR:[
                            {name: {contains:name, mode:"insensitive"}},
                            {lastName: {contains:name, mode:"insensitive"}}
                        ]
                    }}),
                },
                include:{
                    user:{
                        select:{
                            name:true,
                            lastName:true,
                            email:true,
                            phone:true
                        }
                    }
                }
            })

            if (withPending) {
                const pendingManagers = await this.getPendingManagers({name});
                return { managers, pendingManagers}
            }

            return managers;
            
        } catch (error: any) {
            throw new AppError(error.message || 'Erro interno ao listar gestores', error.statusCode || 500);
        }
    }

    static async getInfo ({managerId}:GetInfoInterface) {
        try {
            const manager = await prisma.manager.findUnique({
                where:{id:managerId},
                include: {
                    user:{
                        select:{
                            name:true,
                            lastName:true,
                            email:true,
                            phone:true
                        }
                    },
                    permissions:{
                        select:{active:true, permissionId:true}
                    }
                }
            })

            if(!manager) {
                throw new AppError("Gestor não encontrado", 404);
            }

            const permissionsArray = manager.permissions
                .filter((p) => p.active)
                .map((p) => p.permissionId)

            return {
                ...manager,
                permissions: permissionsArray
            };

        } catch (error: any) {
            throw new AppError(error.message || 'Erro interno ao buscar gestor', error.statusCode || 500);
        }
    }

    static async getPendingManagers ({name}: GetPendingManagersInterface) {
        try {
            const pendingmanagers = await prisma.invite.findMany({
                select:{
                    id:true,
                    invitorId:true,
                    lineId:true,
                    invitedEmail:true,
                    createdAt:true,
                    acceptedAt:true,
                    declinedAt:true,
                    userInvited:{select:{
                        name:true, lastName:true, phone:true
                    }}
                },
                where:{
                    acceptedAt:null,
                    role:RoleEnum.MANAGER
                },
                orderBy:{createdAt:"asc"},
            })

            return pendingmanagers;
        } catch (error: any) {
            throw new AppError(error.message || 'Erro interno ao listar gestores pendentes', error.statusCode || 500);
        }
    }

}
