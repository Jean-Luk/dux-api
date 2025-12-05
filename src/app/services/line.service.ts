import { randomUUID } from "crypto";
import prisma from "../../config/prisma";
import { PointFlavorEnum, RoleEnum, StatusEnum, CardStatusEnum } from "../../types/enums";
import { AppError } from "../utils/AppError";
import { Helper } from "../utils/Helper";
import { supabase } from "../../config/supabase";
import logger from "../../config/logger";

interface ListInterface {
    page?: number;
    limit?: number;
    orderField?: "name"|"active"|"departureTime"|"billDueDate";
    orderDirection?: "asc"|"desc";
    status?: "active"|"unactive";
    name?: string;
}

interface CreateInterface {
    name: string;
    departureTime: string;
    weekdays: (0|1|2|3|4|5|6)[];
    active: boolean;
}

interface GetInfoInterface {
    lineId: string
}

interface UpdateInterface {
    lineId?: string;
    name?: string;
    departureTime?: string;
    weekdays?: (0|1|2|3|4|5|6)[];
    active?: boolean;
    billDueDate?: number;
    supportPhone?: string;
    supportEmail?: string
}

interface DeleteInterface {
    lineId: string;
}

interface GetPointsInterface {
    lineId: string;
}

interface CreatePointInterface {
    lineId: string;
    address: string;
    sequencePosition: number;
    latitude: number;
    longitude: number;
    flavor: PointFlavorEnum;
}

interface UpdatePointInterface {
    lineId: string;
    pointId: number;
    address?: string;
    sequencePosition?: number;
    latitude?: number;
    longitude?: number;
    flavor?: PointFlavorEnum;
}

interface DeletePointInterface {
    lineId: string;
    pointId: number;
}

interface GetDriversInterface {
    lineId: string;
    status?: string;
    name?: string;
    withPending?: boolean;
}

interface GetPendingDriversInterface {
    lineId: string;
    name?: string;
}

interface UpdateDriverInterface {
    lineId: string;
    driverId: number;
    status: StatusEnum.ACTIVE|StatusEnum.UNACTIVE;
}

interface DeleteDriverInterface {
    lineId: string;
    driverId: number;
}

interface GetPassengersInterface {
    lineId: string;
    status?: string;
    cardStatus?: string;
    name?: string;
    withPending?: boolean;
}

interface GetPendingPassengersInterface {
    lineId: string;
    name?: string;
}

interface UpdatePassengerInterface {
    lineId: string;
    passengerId: number;
    status: StatusEnum.ACTIVE|StatusEnum.UNACTIVE;
    cardStatus: CardStatusEnum;
}

interface DeletePassengerInterface {
    lineId: string;
    passengerId: number;
}
interface GetDriverIfSharingInterface {
    lineId: string;
    driverId: number;
    passengerUserId: string;
}interface PostPassengerDocumentInterface {
    title: string;
    passengerId: number;
    file?: Express.Multer.File;
}
interface GetPassengerDocumentInterface {
    documentId: number;
}
interface DeletePassengerDocumentInterface {
    documentId: number;
}
interface GetPassengerDocumentsInterface {
    passengerId: number;
}
export class LineService {
    static async list ({page=1, limit=10, orderField='name', orderDirection='asc', status, name=""}: ListInterface) {
        try {
            const skip = (page - 1) * limit;

            const orderBy = { [orderField]: orderDirection }

            const lines = await prisma.line.findMany({
                skip,
                take: limit,
                orderBy,
                where:{
                    ...(name && {name: {contains:name, mode:"insensitive"}}),
                    ...(status && {active: status === "active" ? true : false}),
                },
                include: {_count:{
                    select:{drivers:true,passengers:true,points:true}
                }}
            })

            return lines;
        } catch (error: any) {
            throw new AppError(error.message || 'Erro interno ao listar linhas', error.statusCode || 500);
        }
    }

    static async create ({name, departureTime, weekdays, active=true}:CreateInterface) {
        try {
            // Trata o nome e verifica se é válido
            const sanitizedName = name.trim()
            if(sanitizedName === "") {
                throw new AppError('Nome inválido', 400);
            }

            // Verifica se horário de partida é um horário válido e trata ele para salvar no banco
            if(!Helper.isValidTime(departureTime)) {
                throw new AppError('Horário inválido', 400);
            }

            const weekdaysToCreate = weekdays.map(num => ({
                weekday: num
            }))

            const line = await prisma.line.create({data:{
                name:sanitizedName,
                active,
                departureTime: Helper.parseHHmmToDate(departureTime),
                lineWeekdays:{
                    create: weekdaysToCreate
                }},
                include:{ 
                    lineWeekdays:{select:{weekday:true}}
                }

            })

            const weekdaysArray: number[] = line.lineWeekdays.map(w => w.weekday);

            return {
                ...line,
                lineWeekdays: weekdaysArray
            };

        } catch (error: any) {
            throw new AppError(error.message || 'Erro interno ao criar linha', error.statusCode || 500);
        }
    }

    static async getInfo ({lineId}:GetInfoInterface) {
        try {
            const line = await prisma.line.findUnique({
                where:{id:lineId},
                include: {
                    lineWeekdays:{
                        select: {
                            weekday: true
                        }
                    }
                }
            })

            if(!line) {
                throw new AppError("Linha não encontrada", 404);
            }
            
            const weekdaysArray: number[] = line.lineWeekdays.map(w => w.weekday);

            return {
                ...line,
                lineWeekdays: weekdaysArray
            };

        } catch (error: any) {
            throw new AppError(error.message || 'Erro interno ao buscar linha', error.statusCode || 500);
        }
    }

    static async update ({lineId, name, departureTime, weekdays, active, billDueDate, supportEmail, supportPhone}:UpdateInterface) {
        try {
            // Trata o nome e verifica se é válido
            const sanitizedName = name?.trim()
            if(sanitizedName === "") {
                throw new AppError('Nome inválido', 400);
            }
            // Verifica se horário de partida é um horário válido e trata ele para salvar no banco
            if(departureTime && !Helper.isValidTime(departureTime)) {
                throw new AppError('Horário inválido', 400);
            }
            // Verifica se data de vencimento dos boletos é um dia válido 
            if (billDueDate && (billDueDate < 1 || billDueDate > 28)) {
                throw new AppError('Data de vencimento deve ser entre 1 e 28', 400);
            }
            // Caso tenha sido especificado um e-mail para suporte, verifica se o mesmo é válido
            if (supportEmail && !Helper.isValidEmail(supportEmail)) {
                throw new AppError('E-mail de contato para suporte é inválido', 400);
            }
            // Caso tenha sido especificado um telefone para suporte, verifica se o mesmo é válido
            if (supportPhone && !Helper.isValidPhone(supportPhone)) {
                throw new AppError('Telefone de contato para suporte é inválido', 400);
            }
            const sanitizedSupportPhone = supportPhone ? Helper.sanitizePhone(supportPhone) : null;

            // Verifica quais campos serão atualizados e atribui seus valores
            const dataToUpdate: any = {};
            if (sanitizedName) dataToUpdate.name = sanitizedName;
            if (departureTime) dataToUpdate.departureTime = Helper.parseHHmmToDate(departureTime);
            if (weekdays) {
                dataToUpdate.lineWeekdays = {
                    deleteMany:{},
                    create: weekdays.map(num => ({
                        weekday: num
                    }))
                };
            }
            if (active !== undefined) dataToUpdate.active = active;
            if (billDueDate) dataToUpdate.billDueDate = billDueDate;
            if (supportPhone !== null) dataToUpdate.supportPhone = sanitizedSupportPhone;
            if (supportEmail !== null) dataToUpdate.supportEmail = supportEmail;

            // Atualiza a linha
            const updatedLine = await prisma.line.update({
                data:dataToUpdate,
                where:{id:lineId},
                include:{lineWeekdays:{
                    select:{weekday:true}
                }}
            })

            // Formata os dias da semana para enviar na resposta
            const weekdaysArray: number[] = updatedLine.lineWeekdays.map(w => w.weekday);

            return {
                ...updatedLine,
                lineWeekdays: weekdaysArray
            };
            

        } catch (error: any) {
            throw new AppError(error.message || 'Erro interno ao atualizar linha', error.statusCode || 500);
        }
    }

    static async delete ({lineId}:DeleteInterface) {
        try {
            const lineToDelete = await prisma.line.findUnique({
                where:{id:lineId}
            })

            if(!lineToDelete) {
                throw new AppError('Linha inexistente', 404);
            }

            if (lineToDelete.active) {
                throw new AppError('Linhas ativas não podem ser deletadas', 400);
            }

            await prisma.line.delete({
                where:{id:lineId},
            })

        } catch (error: any) {
            throw new AppError(error.message || 'Erro interno ao deletar linha', error.statusCode || 500);
        }
    }

    static async getPoints ({lineId}: GetPointsInterface) {
        try {
            const points = await prisma.point.findMany({
                where:{lineId},
                orderBy:{sequencePosition:"asc"}
            })

            return points;
        } catch (error: any) {
            throw new AppError(error.message || 'Erro interno ao deletar linha', error.statusCode || 500);
        }
    }

    static async createPoint ({lineId, address, flavor, latitude, longitude, sequencePosition}: CreatePointInterface) {
        try {

            if(!Helper.isValidCoordinates(latitude, longitude)) {
                throw new AppError('Coordenadas inválidas', 400);
            }

            if(sequencePosition < 1) {
                throw new AppError('Posição inválida: a sequência deste ponto está incorreta', 400);
            }

            const line = await prisma.line.findUnique({
                where:{id:lineId}, 
                include:{
                    points:{
                        select:{flavor:true, sequencePosition:true},
                        orderBy:{sequencePosition:'asc'}
                    }
                }
                
            });

            if(!line) {
                throw new AppError('Linha inexistente', 404);                
            }

            // Valida se a sequência especificada é válida
            if(sequencePosition > line.points.length+1) {
                throw new AppError('Posição inválida: a sequência deste ponto está incorreta', 400);
            }
            this.validatePointPosition(flavor, sequencePosition, line.points);

            const newPoint = await prisma.$transaction(async (tx) => {

                await tx.point.updateMany({
                    data:{
                        sequencePosition: {
                            increment: 1
                        },
                    },
                    where:{
                        lineId,
                        sequencePosition: {
                            gte: sequencePosition
                        }
                    }
                })

                const newPoint = await tx.point.create({
                    data:{
                        address,
                        flavor,
                        latitude,
                        longitude,
                        sequencePosition,
                        lineId
                    }
                })

                return newPoint
            })

            return newPoint;

        } catch (error: any) {
            throw new AppError(error.message || 'Erro interno ao criar ponto', error.statusCode || 500);
        }
    }

    static async updatePoint ({lineId, pointId, address, flavor, latitude, longitude, sequencePosition}: UpdatePointInterface) {
        try {

            if(latitude !== undefined && !Helper.isValidLatitude(latitude)) {
                throw new AppError('Latitude inválida', 400);
            }
            if(longitude !== undefined && !Helper.isValidLongitude(longitude)) {
                throw new AppError('Longitude inválida', 400);
            }

            if(isNaN(pointId)) {
                throw new AppError('Ponto inexistente', 404);
            }

            const line = await prisma.line.findUnique({
                where:{id:lineId}, 
                include:{
                    points:{
                        select:{flavor:true, sequencePosition:true},
                        orderBy:{sequencePosition:'asc'}
                    }
                }
                
            });

            if(!line) {
                throw new AppError('Linha inexistente', 404);                
            }

            const point = await prisma.point.findUnique({
                where:{id:pointId}
            })

            if(!point) {
                throw new AppError('Ponto inexistente', 404);
            }

            if(flavor === undefined) {
                flavor = point.flavor as PointFlavorEnum;
            }

            // Valida se a sequência especificada é válida
            if(sequencePosition !== undefined) {
                if(sequencePosition > line.points.length+1 || sequencePosition < 1) {
                    throw new AppError('Posição inválida: a sequência deste ponto está incorreta', 400);
                }
                this.validatePointPosition(
                    flavor, 
                    sequencePosition, 
                    line.points.filter((p) => p.sequencePosition !== point.sequencePosition)
                    .map(p => ({
                        ...p,
                        sequencePosition: p.sequencePosition > point.sequencePosition ? p.sequencePosition-1 : p.sequencePosition
                    }))
                )
            }

            const dataToUpdate: any = {}
            if(address !== undefined) dataToUpdate.address = address;
            if(flavor !== undefined) dataToUpdate.flavor = flavor;
            if(latitude !== undefined) dataToUpdate.latitude = latitude;
            if(longitude !== undefined) dataToUpdate.longitude = longitude;
            if(sequencePosition !== undefined) dataToUpdate.sequencePosition = sequencePosition;
            
            const updatedPoint = await prisma.$transaction(async (tx) => {

                if(sequencePosition !== undefined) {
                    if(sequencePosition < point.sequencePosition) {
                        // Caso a nova posição for menor que a anterior, move os pontos intermediários para cima
                        await tx.point.updateMany({
                            data:{
                                sequencePosition: {
                                    increment: 1
                                },
                            },
                            where:{
                                lineId,
                                sequencePosition: {
                                    gte: sequencePosition,
                                    lt: point.sequencePosition
                                }
                            }
                        })
                    } else if (sequencePosition > point.sequencePosition) {
                        // Caso a nova posição for maior que a anterior, move os pontos intermediários para baixo
                        await tx.point.updateMany({
                            data:{
                                sequencePosition: {
                                    decrement: 1
                                },
                            },
                            where:{
                                lineId,
                                sequencePosition: {
                                    lte: sequencePosition,
                                    gt: point.sequencePosition
                                }
                            }
                        })
                    }
                }

                const updatedPoint = await tx.point.update({
                    data:dataToUpdate,
                    where:{id:pointId}
                })

                return updatedPoint
            })

            return updatedPoint;

        } catch (error: any) {
            throw new AppError(error.message || 'Erro interno ao atualizar ponto', error.statusCode || 500);
        }
    }    

    static async deletePoint ({lineId, pointId}: DeletePointInterface) {
        try {

            if(isNaN(pointId)) {
                throw new AppError('Ponto inexistente', 404);
            }
            const line = await prisma.line.findUnique({
                where:{id:lineId}, 
                include:{
                    points:{
                        select:{flavor:true, sequencePosition:true},
                        orderBy:{sequencePosition:'asc'}
                    }
                }
                
            });
            if(!line) {
                throw new AppError('Linha inexistente', 404);                
            }
            const point = await prisma.point.findUnique({
                where:{id:pointId}
            })
            if(!point) {
                throw new AppError('Ponto inexistente', 404);
            }

            const sequencePosition = point.sequencePosition;
            
            await prisma.$transaction(async (tx) => {

                // Move os próximos pontos para baixo
                await tx.point.updateMany({
                    data:{
                        sequencePosition: {
                            decrement: 1
                        },
                    },
                    where:{
                        lineId,
                        sequencePosition: {
                            gt: sequencePosition,
                        }
                    }
                })

                await tx.point.delete({
                    where:{id:pointId}
                })

            })

        } catch (error: any) {
            throw new AppError(error.message || 'Erro interno ao deletar ponto', error.statusCode || 500);
        }
    }    

    static async getDrivers ({lineId, name, status, withPending}: GetDriversInterface) {
        try {

            if(status && !Helper.isValidStatus(status)) {
                throw new AppError('Status especificado é inexistente', 400);
            }

            const drivers = await prisma.driver.findMany({
                select:{
                    id:true, 
                    userId:true,
                    lineId:true, 
                    status:true, 
                    sharingLocation:true,
                    user:{
                        select:{
                            name:true,
                            lastName:true,
                            phone:true,
                            email:true
                        }
                    }
                    
                },
                where:{
                    lineId,
                    ...(name && 
                        {OR:[
                            {user:{name: {contains:name, mode:"insensitive"}}},
                            {user:{lastName: {contains:name, mode:"insensitive"}}},
                        ]}
                    ),
                    ...(status && {status}),
                },
                orderBy:{user:{name:"asc"}},
            })

            if (withPending) {
                const pendingDrivers = await this.getPendingDrivers({lineId, name});

                return {drivers, pendingDrivers}
            }

            return {drivers};
        } catch (error: any) {
            throw new AppError(error.message || 'Erro interno ao listar motoristas', error.statusCode || 500);
        }
    }

    static async getPendingDrivers ({lineId, name}: GetPendingDriversInterface) {
        try {
            const pendingDrivers = await prisma.invite.findMany({
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
                    lineId,
                    acceptedAt:null,
                    role:RoleEnum.DRIVER,
                    ...(name && 
                        {OR:[
                            {invitedEmail:{contains:name, mode:"insensitive"}},
                            {userInvited:{
                                OR:[
                                    {name:{contains:name, mode:"insensitive"}},
                                    {lastName:{contains:name, mode:"insensitive"}}
                                ]
                            }}
                        ]}
                    )
                },
                orderBy:{createdAt:"asc"},
            })

            return pendingDrivers;
        } catch (error: any) {
            throw new AppError(error.message || 'Erro interno ao listar motoristas pendentes', error.statusCode || 500);
        }
    }

    static async updateDriver ({lineId, driverId, status}: UpdateDriverInterface) {
        try {

            if(isNaN(driverId)) {
                throw new AppError('Motorista inexistente', 404);
            }

            const driverExists = await prisma.driver.findUnique(
                {where:{id:driverId, lineId}}
            )

            if(!driverExists) {
                throw new AppError("Motorista inexistente", 404);
            }

            const dataToUpdate: any = {};

            if (status !== undefined) dataToUpdate.status = status;

            const updatedDriver = await prisma.driver.update({
                where:{id:driverId, lineId},
                data:dataToUpdate,
                include:{
                    user:{select:{
                        name:true, lastName:true, phone:true
                    }}
                }
            })

            return updatedDriver;

        } catch (error: any) {
            throw new AppError(error.message || 'Erro interno ao atualizar motorista', error.statusCode || 500);
        }
    }    

    static async deleteDriver ({lineId, driverId}: DeleteDriverInterface) {
        try {

            if(isNaN(driverId)) {
                throw new AppError('Motorista inexistente', 404);
            }

            const driver = await prisma.driver.findUnique({
                where:{id:driverId, lineId}
            })

            if(!driver) {
                throw new AppError("Motorista inexistente", 404);
            }

            if(driver.status !== StatusEnum.LEFT && driver.status !== StatusEnum.UNACTIVE) {
                throw new AppError("Não é possível deletar motoristas com este status", 400);
            }

            await prisma.driver.delete({
                where:{id:driverId, lineId}
            })

        } catch (error: any) {
            throw new AppError(error.message || 'Erro interno ao deletar motorista', error.statusCode || 500);
        }
    }    

    static async getPassengers ({lineId, name, status, cardStatus, withPending}: GetPassengersInterface) {
        try {

            if(status && !Helper.isValidStatus(status)) {
                throw new AppError('Status especificado é inexistente', 400);
            }
            if(cardStatus && !Helper.isValidCardStatus(cardStatus)) {
                throw new AppError('Status de carteirinha especificado é inexistente', 400);
            }

            const passengers = await prisma.passenger.findMany({
                select:{
                    id:true, 
                    status:true, 
                    cardStatus:true,
                    user:{
                        select:{
                            name:true,
                            lastName:true,
                            phone:true,
                            email:true
                        }
                    }                    
                },
                where:{
                    lineId,
                    ...(name && 
                        {OR:[
                            {user:{name: {contains:name, mode:"insensitive"}}},
                            {user:{lastName: {contains:name, mode:"insensitive"}}},
                        ]}
                    ),
                    ...(status && {status}),
                    ...(cardStatus && {cardStatus}),
                },
                orderBy:{user:{name:"asc"}},
            })

            if (withPending) {
                const pendingPassengers = await this.getPendingPassengers({lineId, name})

                return {passengers, pendingPassengers}
            }

            return {passengers};
        } catch (error: any) {
            throw new AppError(error.message || 'Erro interno ao listar passageiros', error.statusCode || 500);
        }
    }

    static async getPendingPassengers ({lineId, name}: GetPendingPassengersInterface) {
        try {
            const pendingPassengers = await prisma.invite.findMany({
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
                    lineId,
                    acceptedAt:null,
                    role:RoleEnum.PASSENGER
                },
                orderBy:{createdAt:"asc"},
            })

            return pendingPassengers;
        } catch (error: any) {
            throw new AppError(error.message || 'Erro interno ao listar passageiros pendentes', error.statusCode || 500);
        }
    }

    static async updatePassenger ({lineId, passengerId, status, cardStatus}: UpdatePassengerInterface) {
        try {

            if(isNaN(passengerId)) {
                throw new AppError('Passageiro inexistente', 404);
            }

            const passengerExists = await prisma.passenger.findUnique(
                {where:{id:passengerId, lineId}}
            )

            if(!passengerExists) {
                throw new AppError("Passageiro inexistente", 404);
            }

            const dataToUpdate: any = {};

            if (status !== undefined) dataToUpdate.status = status;
            if (cardStatus !== undefined) dataToUpdate.cardStatus = cardStatus;

            const updatedPassenger = await prisma.passenger.update({
                where:{id:passengerId, lineId},
                data:dataToUpdate,
                include:{
                    user:{select:{
                        name:true, lastName:true, phone:true
                    }}
                }
            })

            return updatedPassenger;

        } catch (error: any) {
            throw new AppError(error.message || 'Erro interno ao atualizar passageiro', error.statusCode || 500);
        }
    }    

    static async deletePassenger ({lineId, passengerId}: DeletePassengerInterface) {
        try {

            if(isNaN(passengerId)) {
                throw new AppError('Passageiro inexistente', 404);
            }

            const passenger = await prisma.passenger.findUnique({
                where:{id:passengerId, lineId}
            })

            if(!passenger) {
                throw new AppError("Passageiro inexistente", 404);
            }

            if(passenger.status !== StatusEnum.LEFT && passenger.status !== StatusEnum.UNACTIVE) {
                throw new AppError("Não é possível deletar passageiros com este status", 400);
            }

            await prisma.passenger.delete({
                where:{id:passengerId, lineId}
            })

        } catch (error: any) {
            throw new AppError(error.message || 'Erro interno ao deletar passageiro', error.statusCode || 500);
        }
    }    

    private static validatePointPosition (flavor: PointFlavorEnum, sequencePosition: number, currentPoints: {sequencePosition: number; flavor: string;}[]) {
        const flavorToNumber = {
            [PointFlavorEnum.BOARDING_POINT]: 0,
            [PointFlavorEnum.DESTINY_POINT]: 1,
            [PointFlavorEnum.DROPOFF_POINT]: 2,
        }

        const firstByFlavor: Record<PointFlavorEnum, number | undefined> = {
            [PointFlavorEnum.BOARDING_POINT]: undefined,
            [PointFlavorEnum.DESTINY_POINT]: undefined,
            [PointFlavorEnum.DROPOFF_POINT]: undefined,
        };

        const lastByFlavor: Record<PointFlavorEnum, number | undefined> = {
            [PointFlavorEnum.BOARDING_POINT]: undefined,
            [PointFlavorEnum.DESTINY_POINT]: undefined,
            [PointFlavorEnum.DROPOFF_POINT]: undefined,
        };

        for (const point of currentPoints) {
            const flavor = point.flavor as PointFlavorEnum;
            if (firstByFlavor[flavor] === undefined) {
                firstByFlavor[flavor] = point.sequencePosition;
            }
            lastByFlavor[flavor] = point.sequencePosition;
        }

        const flavorOrder = flavorToNumber[flavor];

        // Verifica o flavor anterior
        const previousFlavor = Object.values(PointFlavorEnum).find(f => flavorToNumber[f] === flavorOrder - 1);
        if (previousFlavor && lastByFlavor[previousFlavor] != null && sequencePosition <= lastByFlavor[previousFlavor]) {
            throw new AppError("Posição inválida: a sequência deste ponto está incorreta", 400);
        }

        // Verifica o flavor seguinte
        const nextFlavor = Object.values(PointFlavorEnum).find(f => flavorToNumber[f] === flavorOrder + 1);
        if (nextFlavor && firstByFlavor[nextFlavor] != null && sequencePosition >= firstByFlavor[nextFlavor] + 1) {
            throw new AppError("Posição inválida: a sequência deste ponto está incorreta", 400);
        }
    }

    static async getDriverIfPassengerAuthorized ({lineId, driverId, passengerUserId}: GetDriverIfSharingInterface) {
        try {
            const driver = await prisma.line.findFirst({
                where:{
                    // Busca apenas na linha com o ID passado
                    id:lineId,
                    // Valida se o motorista existe
                    drivers:{
                        some:{
                            id:driverId,
                        }
                    },
                    // Valida se o usuário é passageiro da linha
                    passengers:{
                        some:{
                            userId:passengerUserId
                        }
                    }
                },
                select:{
                    drivers:{
                        select:{
                            userId:true,
                            sharingLocation:true
                        },
                        where:{
                            id:driverId
                        }
                    }
                }
            })

            return driver?.drivers[0] ?? null;
        } catch (error: any) {
            throw new AppError(error.message || 'Erro interno ao buscar motorista', error.statusCode || 500);
        }
    }

    static async postPassengerDocument ({title, passengerId, file}: PostPassengerDocumentInterface) {
        try {
            if (!file) {
                throw new AppError("Erro ao fazer upload. Arquivo não encontrado.", 400);
            }
            if (!title) {
                throw new AppError("Erro ao fazer upload. Título não foi especificado.", 400);
            }

            const passenger = await prisma.passenger.findFirst({
                where:{
                    id:passengerId
                },
                select:{
                    id:true
                }
            })

            if (!passenger) {
                throw new AppError("Passageiro não encontrado ou não existe.", 400);
            }

            const fileName = `${randomUUID()}.pdf`
            const {data, error} = await supabase.storage
                .from("dux-passenger-documents")
                .upload(fileName, file.buffer, {
                    contentType: file.mimetype,
                    upsert: false
                })

            if (error) {
                logger.error(error)
                throw new AppError("Erro ao fazer upload. Tente novamente mais tarde.");
            }

            const fileType = file.mimetype;

            const document = await prisma.passengerDocument.create({
                data:{
                    documentTitle:title,
                    fileName,
                    fileType,
                    passengerId:passenger.id
                },
                select:{
                    id:true,
                    documentTitle:true,
                    fileType:true
                }
            })

            return document
        } catch (error: any) {
            throw new AppError(error.message || 'Erro interno ao inserir documento', error.statusCode || 500);
        }
    }

    static async getPassengerDocument ({ documentId }: GetPassengerDocumentInterface) {
        try {
            const document = await prisma.passengerDocument.findUnique({
                where:{
                    id:documentId
                },
                select:{
                    fileName:true,
                    documentTitle:true,
                    fileType:true,
                    id:true
                }
            });

            if (!document) {
                throw new AppError("Documento inexistente", 400);
            };

            const { data, error } = await supabase.storage
                .from("dux-passenger-documents")
                .createSignedUrl(document.fileName, 60 * 2);

            if (error) {
                throw new AppError("Erro ao recuperar arquivo. Tente novamente mais tarde.");
            }

            return {
                ...document,
                url:data.signedUrl
            }

        } catch (error: any) {
            throw new AppError(error.message || 'Erro interno ao recuperar documento', error.statusCode || 500);
        }
    }

    static async getPassengerDocuments ({ passengerId }: GetPassengerDocumentsInterface) {
        try {
            const documents = await prisma.passengerDocument.findMany({
                where:{
                    passengerId
                },
                select:{
                    id:true,
                    documentTitle:true,
                    fileType:true
                }
            });

            return documents
        } catch (error: any) {
            throw new AppError(error.message || 'Erro interno ao recuperar documento', error.statusCode || 500);
        }
    }

    static async deletePassengerDocument ({ documentId }: DeletePassengerDocumentInterface) {
        try {
            const document = await prisma.passengerDocument.findUnique({
                where:{
                    id:documentId
                },
                select:{
                    fileName:true,
                    id:true
                }
            });

            if (!document) {
                throw new AppError("Documento inexistente", 400);
            };

            const { data, error } = await supabase.storage
                .from("dux-passenger-documents")
                .remove([document.fileName])

            if (error) {
                throw new AppError("Erro ao excluir arquivo. Tente novamente mais tarde.");
            }

            await prisma.passengerDocument.delete({
                where:{
                    id:document.id
                }
            })

            return true

        } catch (error: any) {
            throw new AppError(error.message || 'Erro interno ao recuperar documento', error.statusCode || 500);
        }
    }
}
