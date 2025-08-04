import { Invite, Manager, Prisma, User } from '@prisma/client';
import prisma from '../../config/prisma';
import { AppError } from '../utils/AppError';
import { Helper } from '../utils/Helper';
import { ManagerService } from './manager.service';
import { RoleEnum, PermissionEnum } from '../enums';
import { DriverService } from './driver.service';
import { PassengerService } from './passenger.service';

interface ListInterface {
    user: User
}

interface SendInterface {
    invitedEmail: string,
    role: 'M'|'D'|'P',
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
                where:{invitedId:user.id, acceptedAt:null}
            })

            return invites;

        } catch (error: any) {
            throw new AppError(error.message || 'Erro interno ao listar convites pendentes', error.statusCode || 500);
        }

    }

    static async send ({invitedEmail, role, lineId, invitor, manager}: SendInterface): Promise<Invite> {
        try {

            // Verifica se o email existe e é válido
            if(!invitedEmail || !Helper.isValidEmail(invitedEmail)) {
                throw new AppError('E-mail inválido', 400);                
            }
            // Verifica se o cargo do convite existe e é válido
            if(!role || !Helper.isValidRole(role)) {
                throw new AppError("Cargo do convite inválido", 400);
            }

            // Verifica se o email do convidado possui usuário vinculado
            const invitedUser = await prisma.user.findUnique({
                where:{email:invitedEmail}
            });

            // Se for convite para gestor:
            if(role === RoleEnum.MANAGER) {
                // Verifica se o gestor tem permissão para convidar outros gestores:
                if(!ManagerService.hasPermission({managerId:manager.id, permissionId:PermissionEnum.INVITE_MANAGERS})) {
                    throw new AppError("Não possui permissão para enviar este tipo de convite", 403);
                }

                // Se não há usuário vinculado ao e-mail, não permite enviar convite
                if(!invitedUser) {
                    throw new AppError("Não há uma conta vinculada ao e-mail do convite", 422)
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
                // Cria o convite
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
            // Busca toods os convites pendentes com o email do usuário, porém sem usuário vinculado
            // E atualiza eles, vinculando o id do usuário
            await prismaClient.invite.updateMany({
                where:{
                    invitedId:null, 
                    invitedEmail:user.email, 
                    acceptedAt:null
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
            // Verifica se o convite ainda não foi aceito
            if(invite.acceptedAt) {
                throw new AppError("Convite já foi aceito", 422)
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
            if(invite.acceptedAt) {
                throw new AppError("Convite já foi aceito", 422)
            }
            // Deleta o convite do banco de dados
            await prisma.invite.delete({
                where: {id:inviteId},
            })
            
        } catch (error: any) {
            throw new AppError(error.message || 'Erro interno ao recusar convite', error.statusCode || 500);
        }

    }

}
