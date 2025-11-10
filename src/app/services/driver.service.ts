import { Manager, Prisma, User } from '@prisma/client';
import prisma from '../../config/prisma';
import { AppError } from '../utils/AppError';
import { StatusEnum } from '../../types/enums';
import { RequestUser } from '../../types';

interface CreateInterface {
    user: User;
    lineId: string;
}
interface GetLinesInterface {
    page?: number;
    limit?: number;
    orderField?: "name"|"active"|"departureTime";
    orderDirection?: "asc"|"desc";
    status?: "active"|"unactive";
    name?: string;
    user: RequestUser;
}
interface ListLinesInterface {
    page?: number;
    limit?: number;
    orderField?: "name"|"active"|"departureTime";
    orderDirection?: "asc"|"desc";
    status?: "active"|"unactive";
    name?: string;
    user: RequestUser;
}
interface GetLineInfoInterface {
    lineId: string;
    user: RequestUser;
}

interface IsDriverFromLineInterface {
    lineId: string;
    userId: string;
}
interface StartSharingLocationInterface {
    lineId: string;
    userId: string;
}
interface StopSharingLocationInterface {
    lineId?: string;
    userId: string;
}

export class DriverService {
    static async create ({user, lineId}: CreateInterface, prismaClient : Prisma.TransactionClient = prisma): Promise<Manager> {
        try {
            // Cria o motorista
            const newDriver = await prismaClient.driver.create({
                data:{
                    userId:user.id,
                    lineId,
                    status:StatusEnum.ACTIVE,
                }
            })

            return newDriver;

        } catch (error: any) {
            throw new AppError(error.message || 'Erro interno ao criar motorista', error.statusCode || 500);
        }

    }

    static async getLines ({page=1, limit=10, orderField='name', orderDirection='asc', status, name="", user}: GetLinesInterface) {

        try {
            const skip = (page - 1) * limit;

            const orderBy = { [orderField]: orderDirection }

            const lines = await prisma.line.findMany({
                skip,
                take: limit,
                orderBy,
                where:{
                    passengers:{
                        some:{
                            userId:user.id
                        }
                    },
                    ...(name && {name: {contains:name, mode:"insensitive"}}),
                    ...(status && {active: status === "active" ? true : false}),
                }
            })

            return lines;
        } catch (error: any) {
            throw new AppError(error.message || 'Erro interno ao listar linhas do motorista', error.statusCode || 500);
        }
    }

    static async listLines ({page=1, limit=10, orderField='name', orderDirection='asc', status, name="", user}: ListLinesInterface) {
        try {
            const skip = (page - 1) * limit;
            const orderBy = { [orderField]: orderDirection }

            const lines = await prisma.line.findMany({
                skip,
                take: limit,
                orderBy,
                select:{
                    id:true,
                    name:true,
                    departureTime:true,
                    active:true,
                    billDueDate:true
                },
                where:{
                    drivers:{
                        some:{
                            userId:user.id
                        }
                    },
                    ...(name && {name: {contains:name, mode:"insensitive"}}),
                    ...(status && {active: status === "active" ? true : false}),
                }
            })

            return lines;
        } catch (error: any) {
            throw new AppError(error.message || 'Erro interno ao listar linhas do motorista', error.statusCode || 500);
        }
    }

    static async getLineInfo ({lineId, user}: GetLineInfoInterface) {
        try {

            const today = new Date();

            const line = await prisma.line.findUnique({
                select:{
                    // Informações gerais da linha:
                    id:true,
                    active:true,
                    departureTime:true,
                    name:true,
                    // Joins:
                    // Passageiros da linha:
                    passengers:{
                        select:{
                            // Informações gerais do passageiro
                            id:true,
                            user:{
                                select:{
                                    name:true,
                                    lastName:true,
                                    phone:true
                                }
                            },
                            // Check-ins dos passageiros
                            checkins:{
                                select:{
                                    checkinTimestamp:true,
                                },
                                where:{
                                    checked:true,
                                    checkinDate:today
                                }
                            }
                        },
                        where:{
                            status:StatusEnum.ACTIVE
                        }
                    },
                    // Informações do usuário motorista:
                    drivers:{
                        select:{
                            id:true,
                            sharingLocation:true
                        },
                        where:{
                            userId:user.id
                        }
                    },
                    // Dias da semana que a linha funciona:
                    lineWeekdays:{
                        select:{
                            weekday:true
                        }
                    },
                    // Pontos da linha:
                    points:{
                        select:{
                            id:true,
                            address:true,
                            flavor:true
                        },
                        orderBy:{
                            sequencePosition:"asc"
                        }
                    },
                    // Contagens:
                    _count:{
                        select:{
                            // Contagem dos check-ins do dia
                            passengerCheckins:{
                                where:{
                                    checked:true,
                                    checkinDate:today
                                }
                            },
                            // Quantidade total de motoristas
                            drivers:{
                                where:{
                                    status:StatusEnum.ACTIVE
                                }
                            }
                        }
                    },
                },
                where:{
                    drivers:{some:{userId:user.id, status:StatusEnum.ACTIVE}}, // Verificar se usuário é motorista da linha
                    id:lineId
                }
            })
            
            // Se não encontrou linha, usuário não faz parte dela ou ela não existe
            if(!line) {
                throw new AppError("Linha inexistente.", 400)
            }

            const weekdaysArray: number[] = line.lineWeekdays.map(w => w.weekday);

            // Formatar check-in dos passageiros:
            const formatedPassengers = line.passengers.map((p) => {
                return {
                    ...p,
                    checkin: p.checkins[0]?.checkinTimestamp || null,
                    checkins: undefined
                }
            })

            return {
                ...line,
                lineWeekdays: weekdaysArray,
                driverInfo: line.drivers[0],
                drivers:undefined,
                passengers:formatedPassengers,
            };

        } catch (error: any) {
            throw new AppError(error.message || 'Erro interno ao buscar informações da linha do motorista', error.statusCode || 500);
        }
    }

    static async isDriverFromLine ({userId, lineId}: IsDriverFromLineInterface) {
        try {
            const isDriver = await prisma.driver.findFirst({
                where:{
                    lineId,
                    userId
                },
                select:{
                    sharingLocation:true
                }
            })

            return isDriver ?? false;

        } catch (error: any) {
            throw new AppError(error.message || 'Erro interno ao verificar motorista da linha', error.statusCode || 500);
        }
    }

    static async startSharingLocation ({userId, lineId}: StartSharingLocationInterface) {
        try {
            await prisma.driver.update({
                where:{
                    userId_lineId:{
                        lineId,
                        userId
                    }
                },
                data:{
                    sharingLocation:true
                }
            })

        } catch (error: any) {
            throw new AppError(error.message || 'Erro interno ao iniciar compartilhamento de localização do motorista', error.statusCode || 500);
        }
    }
    
    static async stopSharingLocation ({userId, lineId}: StopSharingLocationInterface) {
        try {

            const where = lineId ? {
                // Caso tenha sido especificada uma linha, atualiza apenas ela
                lineId,
                userId
            } : {
                // Do contrário, atualiza todas as linhas
                userId
            }

            await prisma.driver.updateMany({
                where,
                data:{
                    sharingLocation:false
                }
            })

        } catch (error: any) {
            throw new AppError(error.message || 'Erro interno ao parar compartilhamento de localização do motorista', error.statusCode || 500);
        }
    }
}
