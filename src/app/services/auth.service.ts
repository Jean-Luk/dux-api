import { User } from '@prisma/client';
import prisma from '../../config/prisma';
import { AppError } from '../utils/AppError';
import { Helper } from '../utils/Helper';
import { SecurityHelper } from '../utils/SecurityHelper';
import { differenceInMinutes } from 'date-fns';

const SESSION_EXPIRATION_MINUTES : number = Number(process.env.SESSION_EXPIRATION_MINUTES) || 60;

interface RegisterInterface {
    email: string,
    cpf: string,
    name: string,
    lastName: string,
    phone: string,
    password: string
}

interface LoginInterface {
    login: string,
    password: string,
    ephemeral: boolean
}
interface LoginResultInterface {
    user: User,
    authToken: string
}

export class AuthService {
    static async register ({email, cpf, name, lastName, phone, password}: RegisterInterface) {
        try {

            // Valida campos obrigatórios:
            if(!email || !cpf || !name || !lastName || !password) {
                throw new AppError('Todos os campos são obrigatórios', 400);
            }

            // Verifica se os dados são válidos
            if(!Helper.isValidCPF(cpf)) {
                throw new AppError('CPF inválido', 400);
            }
            if(!Helper.isValidEmail(email)) {
                throw new AppError('E-mail inválido', 400);
            }
            if(!Helper.isValidPhone(phone)) {
                throw new AppError('Número de telefone inválido', 400);
            }
            // Remove os caracteres especiais
            const sanitizedCPF = Helper.sanitizeCPF(cpf);
            const sanitizedPhone = Helper.sanitizePhone(phone);
            
            // Verifica se já existe usuário com este email ou cpf
            const existingUser = await prisma.user.findFirst({
                where: {
                    OR: [
                        {email},
                        {cpf:sanitizedCPF},
                    ]
                }
            });
            if (existingUser) {
                if (existingUser.email === email) {
                    throw new AppError('Email já cadastrado', 409)
                }
                throw new AppError('CPF já cadastrado', 409)
            }

            // Gera o salt e o hash da senha
            const salt = await SecurityHelper.generateSalt();
            const hashPassword = await SecurityHelper.generateHashPassword(password, salt);

            // Cria o user e login
            const newUser = await prisma.user.create({
                data: {
                    email,
                    cpf:sanitizedCPF,
                    name,
                    lastName,
                    phone:sanitizedPhone,
                    login: {
                        create:
                            {
                                password:hashPassword,
                                salt
                            }                        
                    }
                }
            })

            return newUser;

        } catch (error: any) {
            throw new AppError(error.message || 'Erro interno ao registrar usuário', error.statusCode || 500);
        }

    }
    
    static async login ({login, password, ephemeral} : LoginInterface): Promise<LoginResultInterface> {
        try {
            // Valida campos obrigatórios:
            if (!login || !password) {
                throw new AppError('Todos os campos são obrigatórios', 400);
            }
    
            // Caso seja CPF, remove os caracteres especiais
            if(Helper.isValidCPF(login)) {
                login = Helper.sanitizeCPF(login);
            }
    
            // Login pode ser e-mail ou CPF
            // Busca o usuário por qualquer um dos parâmetros:
            const user = await prisma.user.findFirst({
                where: {
                    OR: [
                        {email:login},
                        {cpf:login},
                    ]
                },
                include: {
                    login:true
                }
            });
    
            // Se user ou login é null, lança erro padrão
            if(!user || !user.login) {
                throw new AppError('Usuário ou senha inválidos', 400);
            }
            // Se senha está incorreta, lança erro padrão
            if(!(await SecurityHelper.checkPassword(password, user.login.password))) {
                throw new AppError('Usuário ou senha inválidos', 400);
            }
            // Após todas as verificações, gera o authtoken
            const authToken = SecurityHelper.generateAuthToken(user.id);
            
            // Cria a session no banco de dados
            await prisma.session.create({
                data: {
                    authToken,
                    ephemeral:ephemeral ?? true,
                    lastAccess: new Date(),
                    loginId:user.login.id
                }
            })
    
            return {authToken, user}

        } catch (error: any) {
            throw new AppError(error.message || 'Erro interno ao realizar login', error.statusCode || 500);
        }
    }
}
