import { Manager, Prisma, User } from '@prisma/client';
import prisma from '../../config/prisma';
import { AppError } from '../utils/AppError';
import { StatusEnum } from '../../types/enums';
import { RequestUser } from '../../types';
import { supabase } from '../../config/supabase';

interface CreateInterface {
    user: User;
    lineId: string;
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

interface CheckinInterface {
    checked: boolean;
    user: RequestUser;
    lineId: string;
}

interface ChangeCheckinPointsInterface {
    boardingPointId: number;
    destinyPointId: number;
    dropoffPointId: number;
    lineId: string;
    user: RequestUser;
}
interface GetLineInfoInterface {
    lineId: string;
    user: RequestUser;
}
interface GetCardInfoInterface {
    lineId: string;
    user: RequestUser
}
interface GetPassengerLineDocumentsInterface {
    lineId: string;
    user: RequestUser;
}
interface GetPassengerDocumentsInterface {
    user: RequestUser;
}
interface GetPassengerDocumentInterface {
    documentId: number;
    user: RequestUser;
}
export class PassengerService {
    static async create ({user, lineId}: CreateInterface, prismaClient : Prisma.TransactionClient = prisma): Promise<Manager> {
        try {
            // Cria o passageiro
            const newPassenger = await prismaClient.passenger.create({
                data:{
                    userId:user.id,
                    lineId,
                    status:StatusEnum.ACTIVE
                }
            })

            return newPassenger;

        } catch (error: any) {
            throw new AppError(error.message || 'Erro interno ao criar passageiro', error.statusCode || 500);
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
            throw new AppError(error.message || 'Erro interno ao listar linhas do passageiro', error.statusCode || 500);
        }
    }

    static async putCheckin ({checked, lineId, user}: CheckinInterface) {
        try {
            const passenger = await prisma.passenger.findUnique({
                select:{
                    id:true,
                    boardingPointId:true,
                    destinyPointId:true,
                    dropoffPointId:true,
                    line:{
                        select:{
                            active:true,
                            lineWeekdays:{
                                select:{
                                    weekday:true
                                }
                            }
                        }
                    }
                },
                where:{
                    userId_lineId:{
                        userId:user.id,
                        lineId:lineId
                    },
                    status:StatusEnum.ACTIVE
                },
            });

            // Caso o passageiro não tenha sido encontrado, significa que a linha não existe ou ele não participa da linha
            if(!passenger) {
                throw new AppError("Linha inexistente.", 400)
            }

            // Verifica se o passageiro possui os pontos selecionados
            if(!passenger.boardingPointId || !passenger.destinyPointId || !passenger.dropoffPointId) {
                throw new AppError("Preencha seus pontos de embarque, destino e desembarque para realizar check-in.", 400)
            }

            // Verifica se a linha está ativa
            if (!passenger.line.active) {
                throw new AppError("Esta linha não está ativa no momento.", 400)
            }

            const today = new Date();
            const weekday = today.getDay();

            // Verifica se a linha funciona no dia de hoje (dia da semana)
            if (!(passenger.line.lineWeekdays.some((w) => w.weekday === weekday))) {
                throw new AppError("Esta linha não funciona no dia atual.", 400)
            }

            // Atualiza ou insere o check-in para o dia de hoje
            await prisma.passengerCheckin.upsert({
                where:{
                    lineId_passengerId_checkinDate:{
                        checkinDate:today,
                        lineId,
                        passengerId:passenger.id
                    }
                },
                create:{
                    checkinDate:today,
                    checkinTimestamp:today,
                    checked,
                    lineId,
                    passengerId:passenger.id
                },
                update:{
                    checked,
                    checkinTimestamp:today,
                }
            })

            return true;
        } catch (error: any) {
            throw new AppError(error.message || 'Erro interno ao listar linhas do passageiro', error.statusCode || 500);
        }
    }

    static async updateCheckinPoints ({boardingPointId, destinyPointId, dropoffPointId, lineId, user}: ChangeCheckinPointsInterface) {
        try {
            const passenger = await prisma.passenger.findUnique({
                select:{
                    id:true
                },
                where:{
                    userId_lineId:{
                        userId:user.id,
                        lineId:lineId
                    },
                    status:StatusEnum.ACTIVE
                },
            });

            // Caso o passageiro não tenha sido encontrado, significa que a linha não existe ou ele não participa da linha
            if(!passenger) {
                throw new AppError("Linha inexistente.", 400)
            }
            
            // Define quais pontos deve atualizar com base nos campos preenchidos na requisição
            const dataToUpdate: any = {};
            if (boardingPointId !== undefined) dataToUpdate.boardingPointId = boardingPointId;
            if (destinyPointId !== undefined) dataToUpdate.destinyPointId = destinyPointId;
            if (dropoffPointId !== undefined) dataToUpdate.dropoffPointId = dropoffPointId;
            
            const updatedCheckinPoints = await prisma.passenger.update({
                where:{
                    id:passenger.id
                },
                data:dataToUpdate,
                select:{boardingPointId:true, destinyPointId:true, dropoffPointId:true}
            })

            return updatedCheckinPoints;
        } catch (error: any) {
            throw new AppError(error.message || 'Erro interno ao atualizar pontos do passageiro', error.statusCode || 500);
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
                    billDueDate:true,
                    departureTime:true,
                    name:true,
                    // Joins:
                    // Motoristas da linha:
                    drivers:{
                        select:{
                            id:true,
                            sharingLocation:true,
                            // Nome e telefone dos motoristas:
                            user:{
                                select:{
                                    name:true,
                                    lastName:true,
                                    phone:true
                                }
                            }
                        },
                        where:{
                            status:StatusEnum.ACTIVE
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
                            // Quantidade total de passageiros
                            passengers:{
                                where:{
                                    status:StatusEnum.ACTIVE
                                }
                            }
                        }
                    },
                    // Se o usuário já fez check-in:
                    passengerCheckins:{
                        select:null,
                        where:{
                            checked:true,
                            checkinDate:today,
                            passenger:{
                                user:{
                                    id:user.id
                                }
                            }
                        }
                    },
                    passengers:{
                        select:{
                            // ID do passageiro e status da carteirinha
                            id:true,
                            cardStatus:true,
                            // Pontos de embarque/destino/desembarque do usuário
                            boardingPointId:true,
                            destinyPointId:true,
                            dropoffPointId:true,
                            // Documentos do usuário:
                            documents:{
                                select:{
                                    documentTitle:true,
                                    fileType:true,
                                    id:true
                                }
                            }
                        },
                        where:{
                            userId:user.id,
                            status:StatusEnum.ACTIVE
                        }
                    },
                },
                where:{
                    passengers:{some:{userId:user.id, status:StatusEnum.ACTIVE}}, // Verificar se usuário é passageiro da linha
                    id:lineId
                },
            })
            
            if(!line) {
                throw new AppError("Linha inexistente.", 400)
            }
            const weekdaysArray: number[] = line.lineWeekdays.map(w => w.weekday);

            return {
                ...line,
                lineWeekdays: weekdaysArray,
                madeCheckin: line.passengerCheckins.length > 0,
                passengerInfo: line.passengers[0],
                passengers: undefined,
                passengerCheckins: undefined
            };

        } catch (error: any) {
            throw new AppError(error.message || 'Erro interno ao buscar informações da linha do passageiro', error.statusCode || 500);
        }
    }


    static async getCardInfo ({lineId, user}: GetCardInfoInterface) {
        try {
            const today = new Date();

            const passenger = await prisma.passenger.findUnique({
                select:{
                    // Informações gerais do passageiro:
                    id:true,
                    cardStatus:true,
                    // Pontos de embarque/destino/desembarque
                    boardingPoint:{
                        select:{
                            id:true,
                            address:true
                        }
                    },
                    destinyPoint:{
                        select:{
                            id:true,
                            address:true
                        }
                    },
                    dropoffPoint:{
                        select:{
                            id:true,
                            address:true
                        }
                    },
                    // Check-in do dia de hoje
                    checkins:{
                        select:{
                            checked:true,
                            checkinTimestamp:true
                        },
                        where:{
                            checked:true,
                            checkinDate:today,
                            lineId,
                        }
                    },
                    // Informações da linha
                    line: {
                        select:{
                            id:true,
                            name:true
                        }
                    }
                },
                where:{
                    userId_lineId:{
                        userId:user.id,
                        lineId
                    },
                    status:StatusEnum.ACTIVE
                },
            });

            // Caso o passageiro não tenha sido encontrado, significa que a linha não existe ou ele não participa da linha
            if(!passenger) {
                throw new AppError("Linha inexistente.", 400)
            }

            return {
                ...passenger,
                checkin: passenger.checkins[0],
                checkins: undefined
            };
        } catch (error: any) {
            throw new AppError(error.message || 'Erro interno ao buscar informações da carteirinha do passageiro', error.statusCode || 500);
        }
    }

    static async getPassengerLineDocuments({lineId, user}: GetPassengerLineDocumentsInterface) {
        try {
            const documents = await prisma.passengerDocument.findMany({
                where:{
                    passenger:{
                        userId:user.id,
                        lineId
                    }
                },
                select:{
                    documentTitle:true,
                    fileType:true,
                    id:true,
                }
            })

            return documents;
        } catch (error: any) {
            throw new AppError(error.message || "Erro interno ao recuperar documentos da linha do passageiro" , error.statusCode || 500);
        }
    }

    static async getPassengerDocuments({user}: GetPassengerDocumentsInterface) {
        try {
            const documents = await prisma.passengerDocument.findMany({
                where:{
                    passenger:{
                        userId:user.id,
                    }
                },
                select:{
                    documentTitle:true,
                    fileType:true,
                    id:true,
                }
            })

            return documents;

        } catch (error: any) {
            throw new AppError(error.message || "Erro interno ao recuperar documentos do passageiro", error.statusCode || 500);
        }
    }

    static async getPassengerDocument({documentId, user}: GetPassengerDocumentInterface) {
        try {

            const document = await prisma.passengerDocument.findUnique({
                where:{
                    id:documentId,
                    // Garantir que só possa visualizar os próprios documentos
                    passenger:{
                        userId:user.id
                    }
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
            throw new AppError(error.message || "Erro interno ao recuperar documento do passageiro", error.statusCode || 500);
        }
    }
}
