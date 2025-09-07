import { Invite, Manager, Prisma, User } from '@prisma/client';
import prisma from '../../config/prisma';
import { AppError } from '../utils/AppError';
import { Helper } from '../utils/Helper';
import { ManagerService } from './manager.service';
import { RoleEnum, PermissionEnum } from '../../types/enums';
import { DriverService } from './driver.service';
import { PassengerService } from './passenger.service';

interface ListInterface {
    user: User
}

interface SendInterface {
    invitedEmail: string,
    role: RoleEnum,
    lineId?: string,
    invitor: User,
    manager: Manager
}

interface LinkPendingInvitesInterface {
    user: User,
}

interface AcceptInterface {
    user: User
    inviteId: string,
}

interface DeclineInterface {
    user: User
    inviteId: string,
}

interface DeleteInterface {
    manager: Manager
    inviteId: string,
}

export class InviteService {
    static async list ({user}: ListInterface): Promise<Invite[]> {
        try {
            // Busca todos os convites do usuário logado
            const invites = await prisma.invite.findMany({
                where:{invitedId:user.id}
            })

            return invites;

        } catch (error: any) {
            throw new AppError(error.message || 'Erro interno ao listar convites', error.statusCode || 500);
        }

    }

    static async listPending ({user}: ListInterface): Promise<Invite[]> {
        try {
            // Busca todos os convites não aceitos do usuário logado
            const invites = await prisma.invite.findMany({
                where:{
                    invitedId:user.id, 
                    acceptedAt:null, 
                    declinedAt:null
                }
            })

            return invites;

        } catch (error: any) {
            throw new AppError(error.message || 'Erro interno ao listar convites pendentes', error.statusCode || 500);
        }

    }

    static async send ({invitedEmail, role, lineId, invitor, manager}: SendInterface): Promise<Invite> {
        try {
            // Verifica se o email existe e é válido
            if(!Helper.isValidEmail(invitedEmail)) {
                throw new AppError('E-mail inválido', 400);                
            }
            // Verifica se o cargo do convite existe e é válido
            if(!Helper.isValidRole(role)) {
                throw new AppError("Cargo do convite inválido", 400);
            }

            // Verifica se o email do convidado possui usuário vinculado
            const invitedUser = await prisma.user.findUnique({
                where:{email:invitedEmail}
            });

            // Se for convite para gestor:
            if(role === RoleEnum.MANAGER) {
                // Verifica se o gestor tem permissão para convidar outros gestores:
                if(!ManagerService.hasPermission({managerId:manager.id, permissionId:PermissionEnum.EDIT_MANAGERS})) {
                    throw new AppError("Não possui permissão para enviar este tipo de convite", 403);
                }

                // Se não há usuário vinculado ao e-mail, não permite enviar convite
                if(!invitedUser) {
                    throw new AppError("Não há uma conta vinculada ao e-mail do convite", 422)
                }

                const inviteExists = await prisma.invite.findFirst({
                    where:{
                        invitedEmail,
                        role,
                        acceptedAt:null
                    },
                    select:{ id:true }
                })

                if(inviteExists) {
                    throw new AppError("Já há um convite de gestor para este usuário", 409)
                }

                const managerExists = await prisma.manager.findFirst({
                    where:{
                        user:{
                            email:invitedEmail
                        }
                    },
                    select:{ id:true }
                })

                if(managerExists) {
                    throw new AppError("Este usuário já é um gestor", 409)
                }

                // Cria o convite
                const newInvite = await prisma.invite.create({
                    data: {
                        invitedEmail,
                        role,
                        invitorId:invitor.id,
                        invitedId:invitedUser.id
                    }
                })
                return newInvite;

            // Se for convite para motorista ou passageiro:
            } else {
                // Verifica se o gestor tem permissão para convidar passageiros e motoristas (operar linhas):
                if(!ManagerService.hasPermission({managerId:manager.id, permissionId:PermissionEnum.OPERATE_LINES})) {
                    throw new AppError("Não possui permissão para enviar este tipo de convite", 403);
                }

                // Verifica se a linha foi especificada
                if(!lineId) {
                    throw new AppError("Linha do convite não especificada", 400)
                }

                // Verifica se a linha existe
                const line = await prisma.line.findUnique({
                    where:{id:lineId}
                })
                if(!line) {
                    throw new AppError("Linha do convite não existe", 400)
                }

                // Verifica se já existe convite para este usuário desta linha
                const inviteExists = await prisma.invite.findFirst({
                    where:{
                        invitedEmail,
                        lineId,
                        acceptedAt:null
                    },
                    select:{ id:true }
                })
                if (inviteExists) {
                    throw new AppError("Já há um convite desta linha para este usuário", 409)
                }

                // Verifica se convidado é passageiro desta linha
                const isPassenger = await prisma.passenger.findFirst({
                    where:{
                        user:{
                            email:invitedEmail
                        },
                        lineId
                    },
                    select:{ id:true }
                })
                if (isPassenger) {
                    throw new AppError("Este usuário já participa desta linha como passageiro", 409)
                }

                // Verifica se convidado é motorista desta linha
                const isDriver = await prisma.driver.findFirst({
                    where:{
                        user:{
                            email:invitedEmail
                        },
                        lineId
                    },
                    select:{ id:true }
                })
                if (isDriver) {
                    throw new AppError("Este usuário já participa desta linha como motorista", 409)
                }

                // Após validações, cria o convite
                const newInvite = await prisma.invite.create({
                    data: {
                        invitedEmail,
                        role,
                        invitorId:invitor.id,
                        lineId,
                        invitedId:invitedUser ? invitedUser.id : null
                    }
                })
                return newInvite;

            }

        } catch (error: any) {
            throw new AppError(error.message || 'Erro interno ao enviar convite', error.statusCode || 500);
        }
    }

    static async linkPendingInvites ({user}: LinkPendingInvitesInterface, prismaClient: Prisma.TransactionClient = prisma) {
        try {
            // Busca todos os convites pendentes com o email do usuário, porém sem usuário vinculado
            // E atualiza eles, vinculando o id do usuário
            await prismaClient.invite.updateMany({
                where:{
                    invitedId:null, 
                    invitedEmail:user.email
                },
                data:{
                    invitedId:user.id
                }
            })

        } catch (error: any) {
            throw new AppError(error.message || 'Erro interno ao vincular os convites', error.statusCode || 500);
        }
    }

    static async accept ({user, inviteId}: AcceptInterface): Promise<Invite> {
        try {
            // Verifica se o convite existe
            const invite = await prisma.invite.findUnique({
                where: {id:inviteId}
            });
            if (!invite) {
                throw new AppError("Convite inexistente", 404)
            }
            // Verifica se o destinatário é o usuário logado
            if(invite.invitedId !== user.id) {
                throw new AppError("Convite não é destinado ao usuário", 403)
            }
            // Verifica se o convite já foi respondido
            if(invite.acceptedAt || invite.declinedAt) {
                throw new AppError("Convite já foi respondido", 422)
            }
            // Inicia a transaction para atualizar o convite e criar as instâncias do usuário na tabela de gestor/motorista/passageiro:
            const updatedInvite = await prisma.$transaction(async (tx) => {

                switch(invite.role) {
                    case RoleEnum.MANAGER:
                        // Caso seja convite para gestor, cria uma instância de gestor
                        await ManagerService.create({user}, tx);
                    break;
                    case RoleEnum.DRIVER:
                        // Caso seja convite para motorista, cria uma instância de motorista na linha do convite
                        await DriverService.create({user, lineId:invite.lineId!}, tx)
                    break;
                    case RoleEnum.PASSENGER:
                        // Caso seja convite para passageiro, cria uma instância de passageiro na linha do convite
                        await PassengerService.create({user, lineId:invite.lineId!}, tx)
                    break;
                    default:
                        throw new AppError("Convite inválido", 500);
                }
                
                // Insere a data que o convite foi aceito
                const updatedInvite = await tx.invite.update({
                    where: {id:inviteId},
                    data: {acceptedAt: new Date()}
                })
    
                return updatedInvite;

            })
            
            return updatedInvite;

        } catch (error: any) {
            throw new AppError(error.message || 'Erro interno ao aceitar convite', error.statusCode || 500);
        }

    }

    static async decline ({user, inviteId}: DeclineInterface): Promise<void> {
        try {
            // Verifica se o convite existe
            const invite = await prisma.invite.findUnique({
                where: {id:inviteId}
            });
            if (!invite) {
                throw new AppError("Convite inexistente", 404)
            }
            // Verifica se o destinatário é o usuário logado
            if(invite.invitedId !== user.id) {
                throw new AppError("Convite não é destinado ao usuário", 403)
            }
            // Verifica se o convite ainda não foi aceito
            if(invite.acceptedAt || invite.declinedAt) {
                throw new AppError("Convite já foi respondido", 422)
            }
            // Deleta o convite do banco de dados
            await prisma.invite.update({
                where: {id:inviteId},
                data: {declinedAt: new Date()}
            })
            
        } catch (error: any) {
            throw new AppError(error.message || 'Erro interno ao recusar convite', error.statusCode || 500);
        }

    }

    static async delete ({manager, inviteId}: DeleteInterface): Promise<void> {
        try {
            // Verifica se o convite existe
            const invite = await prisma.invite.findUnique({
                where: {id:inviteId}
            });
            if (!invite) {
                throw new AppError("Convite inexistente", 404)
            }
            // Verifica se o convite ainda não foi aceito
            if(invite.acceptedAt || invite.declinedAt) {
                throw new AppError("Este convite já foi respondido", 422)
            }
            const requiredPermission = 
                invite.role === RoleEnum.MANAGER ? PermissionEnum.EDIT_MANAGERS 
                : invite.role === RoleEnum.DRIVER ? PermissionEnum.EDIT_DRIVERS :
                PermissionEnum.EDIT_PASSENGERS

            if(await ManagerService.hasPermission({managerId:manager.id, permissionId:requiredPermission})) {
                throw new AppError("Não possui permissão para cancelar este tipo de convite", 403)
            }

            // Deleta o convite do banco de dados
            await prisma.invite.delete({
                where: {id:inviteId},
            })
            
        } catch (error: any) {
            throw new AppError(error.message || 'Erro interno ao cancelar convite', error.statusCode || 500);
        }

    }

}
