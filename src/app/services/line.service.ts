import { isArray } from "util";
import prisma from "../../config/prisma";
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

interface getInfoInterface {
    lineId: string
}

interface updateInterface {
    lineId?: string;
    name?: string;
    departureTime?: string;
    weekdays?: number[];
    active?: boolean;
    billDueDate?: number
}

interface deleteInterface {
    lineId: string
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

    static async getInfo ({lineId}:getInfoInterface) {
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

    static async update ({lineId, name, departureTime, weekdays, active, billDueDate}:updateInterface) {
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

    static async delete ({lineId}:deleteInterface) {
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

}
