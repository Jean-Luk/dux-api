import prisma from "../../config/prisma";
import { PointFlavorEnum } from "../enums";
import { AppError } from "../utils/AppError";
import { Helper } from "../utils/Helper";

interface ListInterface {
    page?: number;
    limit?: number;
    orderField?: string;
    orderDirection?: string;
    status?: string;
    name?: string;
}

interface CreateInterface {
    name: string;
    departureTime: string;
    weekdays: number[];
    active: boolean;
}

interface GetInfoInterface {
    lineId: string
}

interface UpdateInterface {
    lineId?: string;
    name?: string;
    departureTime?: string;
    weekdays?: number[];
    active?: boolean;
    billDueDate?: number
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



export class LineService {
    static async list ({page=1, limit=10, orderField='name', orderDirection='asc', status="", name=""}: ListInterface) {
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

    static async update ({lineId, name, departureTime, weekdays, active, billDueDate}:UpdateInterface) {
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

            // Verifica quais campos serão atualizados e atribui seus valores
            const dataToUpdate: any = {};
            if (sanitizedName) dataToUpdate.name = sanitizedName;
            if (departureTime) dataToUpdate.departureTime = Helper.parseHHmmToDate(departureTime);
            if (weekdays) {
                dataToUpdate.lineWeekdays = {
                    deleteMany:{},
                    create: weekdays?.map(num => ({
                        weekday: num
                    }))
                };
            }
            if (active !== undefined) dataToUpdate.active = active;
            if (billDueDate) dataToUpdate.billDueDate = billDueDate;

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
                this.validatePointPosition(flavor, sequencePosition, line.points);
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
}
