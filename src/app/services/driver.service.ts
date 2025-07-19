import { Manager, Prisma, User } from '@prisma/client';
import prisma from '../../config/prisma';
import { AppError } from '../utils/AppError';
import { StatusEnum } from '../enums';

interface CreateInterface {
    user: User,
    lineId: string
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

}
