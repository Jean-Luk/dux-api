import { Manager, Prisma, User } from '@prisma/client';
import prisma from '../../config/prisma';
import { AppError } from '../utils/AppError';
import { StatusEnum } from '../enums';

interface CreateInterface {
    user: User,
    lineId: string
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

}
