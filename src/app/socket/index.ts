import { Server } from "socket.io"
import { allowedOrigins, isDev } from "../app";
import logger from "../../config/logger";
import { Helper } from "../utils/Helper";
import prisma from "../../config/prisma";
import setupDriverEvents from "./driver.socket";
import setupPassengerEvents from "./passenger.socket";

let io: Server

export function initSocket (server: any) {
    io = new Server(server, {
        cors: {
            origin: isDev ? '*' : allowedOrigins,
            credentials: true
        }
    })

    io.use(async (socket, next) => {
        // Verificar autenticação do usuário:

        // Recupera o cookie da sessão
        const cookieString = socket.handshake.headers.cookie;
        if (!cookieString) return next(new Error("Não autenticado."));
        const cookies = Helper.cookieStringToObject(cookieString);

        const authToken = cookies.dux_auth_token;
        // Se cookie não existe ou está vazio, retorna erro
        if (!authToken || authToken === "") {
            return next(new Error("Não autenticado."));
        }

        // Procura se existe sessão com o token correspondente
        const session = await prisma.session.findUnique({
            where: { authToken },
            select: {
                login:{
                    select:{
                        userId:true
                    }
                }
            }
        });

        // Se não existe, retorna erro
        if (!session) {
            return next(new Error("Não autenticado."));
        }

        // Salva o id do usuário
        socket.data.userId = session.login.userId;

        next();
    });

    io.on("connection", (socket) => {
        logger.info("[Socket] Conectou: " + socket.id)

        // Inicializar callbacks dos motoristas
        setupDriverEvents(socket);
        setupPassengerEvents(socket);
        
    })
}

export function getIO () {
    return io;
}