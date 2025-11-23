import { Manager, Prisma, User } from '@prisma/client';
import prisma from '../../config/prisma';
import { AppError } from '../utils/AppError';
import { CardStatusEnum, PermissionEnum, PointFlavorEnum, RoleEnum, StatusEnum } from '../../types/enums';

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
interface GetDashboardInterface {
    totalPassengers?:boolean;
    checkinsToday?:boolean;
    cardStatuses?:boolean;
    totalDrivers?:boolean;
    driversSharingLocation?:boolean;
    lineStatistics?:boolean;
    totalLines?:boolean;
    totalPoints?:boolean;
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

    static async getDashboard ({
        totalPassengers=true,
        checkinsToday=true,
        cardStatuses=true,
        totalDrivers=true,
        driversSharingLocation=true,
        lineStatistics=true,
        totalLines=true,
        totalPoints=true
    }: GetDashboardInterface) {
        try {

            type DashboardData = {
                adhesion_percentage: number,
                total_active_passengers: number,
                total_inactive_passengers: number,
                total_active_drivers: number,
                total_inactive_drivers: number,
                total_sharing_location_drivers: number,
                total_checkins_today: number,
                total_green_cards: number,
                total_white_cards: number,
                total_red_cards: number,
                total_active_lines: number,
                total_inactive_lines: number,
                total_morning_lines: number,
                total_afternoon_lines: number,
                total_nocturnal_lines: number,
                total_boarding_points: number,
                total_destiny_points: number,
                total_dropoff_points: number
            }[]

            const data = await prisma.$queryRaw<DashboardData>`

                -- Lógica da porcentagem de adesão nos últimos 30 dias
                WITH last_30_days AS (
                    SELECT 
                        generate_series(
                            (CURRENT_DATE - INTERVAL '29 days')::date,
                            CURRENT_DATE,
                            '1 day'
                        ) AS day
                ),

                line_operational_days AS (
                    SELECT 
                        l.pk_line AS line_id,
                        COUNT(*) AS op_days
                    FROM last_30_days d
                    JOIN line_weekday lw 
                        ON lw.weekday = EXTRACT(DOW FROM d.day)::int
                    JOIN line l 
                        ON l.pk_line = lw.fk_line
                    GROUP BY l.pk_line
                ),

                line_passenger_count AS (
                    SELECT 
                        l.pk_line AS line_id,
                        COUNT(p.pk_passenger) AS passengers
                    FROM line l
                    LEFT JOIN passenger p 
                        ON p.fk_line = l.pk_line
                    GROUP BY l.pk_line
                ),

                possible_checkins AS (
                    SELECT
                        lpd.line_id,
                        lpd.op_days * lpc.passengers AS possible
                    FROM line_operational_days lpd
                    JOIN line_passenger_count lpc 
                        ON lpc.line_id = lpd.line_id
                ),

                performed_checkins AS (
                    SELECT 
                        COUNT(*) AS performed
                    FROM passenger_checkin pc
                    WHERE pc.checkin_date BETWEEN (CURRENT_DATE - INTERVAL '29 days') AND CURRENT_DATE
                ),

                -- Subquery dos PASSAGEIROS
                passenger_counts AS (
                    SELECT
                        COUNT(CASE WHEN status = ${StatusEnum.ACTIVE} THEN 1 END) AS total_active_passengers,
                        COUNT(CASE WHEN status = ${StatusEnum.UNACTIVE} OR status = ${StatusEnum.LEFT} THEN 1 END) AS total_inactive_passengers,

                        COUNT(CASE WHEN card_status = ${CardStatusEnum.GREEN} THEN 1 END) AS total_green_cards,
                        COUNT(CASE WHEN card_status = ${CardStatusEnum.WHITE} THEN 1 END) AS total_white_cards,
                        COUNT(CASE WHEN card_status = ${CardStatusEnum.RED} THEN 1 END) AS total_red_cards
                    FROM passenger
                ),

                -- Subquery dos MOTORISTAS
                driver_counts AS (
                    SELECT
                        COUNT(CASE WHEN status = ${StatusEnum.ACTIVE} THEN 1 END) AS total_active_drivers,
                        COUNT(CASE WHEN status = ${StatusEnum.UNACTIVE} OR status = ${StatusEnum.LEFT} THEN 1 END) AS total_inactive_drivers,
                        COUNT(CASE WHEN status = ${StatusEnum.ACTIVE} AND sharing_location = TRUE THEN 1 END) AS total_sharing_location_drivers
                    FROM driver
                ),

                -- Subquery dos CHECKINS
                checkin_counts AS (
                    SELECT
                        COUNT(DISTINCT CASE WHEN checkin_date = CURRENT_DATE AND checked = TRUE THEN fk_passenger END) AS total_checkins_today
                    FROM passenger_checkin
                ),

                -- Subquery das LINHAS
                line_counts AS ( 
                    SELECT
                        -- Ativas/Inativas
                        COUNT(DISTINCT CASE WHEN active = TRUE THEN pk_line END) AS total_active_lines,
                        COUNT(DISTINCT CASE WHEN active = FALSE THEN pk_line END) AS total_inactive_lines,

                        -- Matutinas (05:00 - 11:59)
                        COUNT(DISTINCT CASE WHEN departure_time >= '05:00' AND departure_time < '12:00'  THEN pk_line END) AS total_morning_lines,
                        -- Vespertinas (12:00 - 16:59)
                        COUNT(DISTINCT CASE WHEN departure_time >= '12:00' AND departure_time < '17:00' THEN pk_line END) AS total_afternoon_lines,
                        -- Noturnas (17:00 - 04:59)
                        COUNT(DISTINCT CASE WHEN departure_time >= '17:00' OR departure_time < '05:00' THEN pk_line END) AS total_nocturnal_lines

                    FROM line
                ),

                -- Subquery dos PONTOS
                point_counts AS ( 
                    SELECT
                        COUNT(DISTINCT CASE WHEN flavor = ${PointFlavorEnum.BOARDING_POINT} THEN pk_point END) AS total_boarding_points,
                        COUNT(DISTINCT CASE WHEN flavor = ${PointFlavorEnum.DESTINY_POINT} THEN pk_point END) AS total_destiny_points,
                        COUNT(DISTINCT CASE WHEN flavor = ${PointFlavorEnum.DROPOFF_POINT} THEN pk_point END) AS total_dropoff_points
                    FROM point
                )

                SELECT

                    -- Porcentagem de adesão nos últimos 30 dias
                    CASE 
                        WHEN (SELECT SUM(possible) FROM possible_checkins) = 0 THEN 0
                        ELSE ROUND(
                            (SELECT performed FROM performed_checkins)::numeric 
                            / (SELECT SUM(possible) FROM possible_checkins)::numeric * 100,
                            2
                        )
                    END AS adhesion_percentage,

                    -- Passageiros
                    p.total_active_passengers,
                    p.total_inactive_passengers,
                    p.total_green_cards,
                    p.total_white_cards,
                    p.total_red_cards,

                    -- Motoristas
                    d.total_active_drivers,
                    d.total_inactive_drivers,
                    d.total_sharing_location_drivers,

                    -- Checkins
                    c.total_checkins_today,

                    -- Linhas
                    l.total_active_lines,
                    l.total_inactive_lines,
                    l.total_morning_lines,
                    l.total_afternoon_lines,
                    l.total_nocturnal_lines,

                    -- Pontos
                    pt.total_boarding_points,
                    pt.total_destiny_points,
                    pt.total_dropoff_points


                FROM passenger_counts p,
                     driver_counts d,
                     checkin_counts c,
                     line_counts l,
                     point_counts pt;
            `

            const result = data[0];

            return { 
                ...result,
                total_cards:result.total_red_cards + result.total_white_cards + result.total_green_cards,
                total_points:result.total_boarding_points + result.total_destiny_points + result.total_dropoff_points,
                drivers_per_line:Number(result.total_active_drivers) / Number(result.total_active_lines),
                passengers_per_line:Number(result.total_active_passengers) / Number(result.total_active_lines),
                points_per_line:(Number(result.total_boarding_points) + Number(result.total_destiny_points) + Number(result.total_dropoff_points)) / Number(result.total_active_lines),
            };

        } catch (error: any) {
            throw new AppError(error.message || 'Erro interno ao carregar dashboard', error.statusCode || 500);
        }
    }
}
