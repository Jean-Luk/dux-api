import { Socket } from "socket.io";
import { DriverService } from "../services/driver.service";
import { Helper } from "../utils/Helper";
import { SocketError } from "../utils/SocketError";
import logger from "../../config/logger";

interface DriverLocation {
	latitude: number;
	longitude: number;
	timestamp: number;
	socketId: string;
	lines: string[]; // linhas que o motorista está compartilhando
}

const driversLocations = new Map<string, DriverLocation>();

function addLineToDriver(userId: string, lineId: string, socketId: string) {
	if (!driversLocations.has(userId)) {
		driversLocations.set(userId, {
            latitude:0,
            longitude:0,
            timestamp: Date.now(),
            socketId,
            lines:[lineId],
        });
	} else {
        if (!driversLocations.get(userId)!.lines.includes(lineId)) {
            driversLocations.get(userId)!.lines.push(lineId)
        }
    }
}

function removeLineFromDriver (userId: string, lineId: string) {
	if (driversLocations.has(userId)) {
        driversLocations.get(userId)!.lines.filter((id) => id !== lineId)
    }
}

function removeAllLinesFromDriver (userId: string) {
	if (driversLocations.has(userId)) {
        driversLocations.get(userId)!.lines = [];
    }
}

function getDriverLines(userId: string): string[] {
	return driversLocations.get(userId)?.lines || [];
}

function removeDriver (userId: string) {
    driversLocations.delete(userId);
}

async function startSharingLocation (socket: Socket, userId: string, lineId: string) {
    // Faz o update no banco de dados
    await DriverService.startSharingLocation({userId, lineId})
    // Adiciona a linha à lista de linhas que o motorista está compartilhando a localização
    addLineToDriver(userId, lineId, socket.id)
    // Finalizado, emite para o cliente que iniciou o compartilhamento
    socket.emit("startedSharingLocation")
}

async function stopSharingLocation (socket: Socket, userId: string, lineId?: string) {
    // Faz o update no banco de dados
    await DriverService.stopSharingLocation({userId, lineId})
    // Remove a linha da lista de linhas que o motorista está compartilhando a localização
    if (lineId) {
        removeLineFromDriver(userId, lineId);
        // Emite para os passageiros que parou de transmitir a localização
        socket.to(`${lineId}-${userId}`).emit("driverStoppedSharingLocation", lineId)
    } else {
        // Emite para os passageiros de todas as linhas que parou de transmitir a localização
        const lines = getDriverLines(userId);
        for (const lineId of lines) {
            socket.to(`${lineId}-${userId}`).emit("driverStoppedSharingLocation", lineId);
        }
        removeAllLinesFromDriver(userId);
    }
    // Finalizado, emite para o motorista que finalizou o compartilhamento com sucesso
    socket.emit("stoppedSharingLocation")
}

export default function setupDriverEvents (socket: Socket) {
    const userId = socket.data.userId;

    socket.on("startSharingLocation", async (lineId: unknown) => {
        try {
            // Verifica se o parâmetro foi passado corretamente
            if (typeof lineId !== "string") {
                throw new SocketError("Linha inválida");
            }
            // Verifica se o motorista participa da linha
            if (!(await DriverService.isDriverFromLine({userId, lineId}))) {
                throw new SocketError("Não autorizado");
            }
            // Após validações, inicia o compartilhamento
            startSharingLocation(socket, userId, lineId);
        } catch (error: any) {
            socket.emit("error", error.message || "Erro interno ao iniciar compartilhamento de localização")
        }

    })

    socket.on("updateDriverLocation", (latitude, longitude) => {
        try {
            // Valida se as coordenadas passadas são válidas
            if(!Helper.isValidCoordinates(latitude, longitude)) {
                throw new SocketError("Coordenadas inválidas")
            }
            // Atualiza a localização
            const driver = driversLocations.get(userId);
            
            // Se não existe, ele não está compartilhando para nenhuma linha
            if (!driver || !driver.lines) {
                throw new SocketError("Não há linhas para compartilhar a localização")
            }

            // Atualiza os dados da localização:
            driver.latitude = latitude;
            driver.longitude = longitude;
            driver.timestamp = Date.now();

            console.log("Recebeu posição do motorista: ")
            console.log(`Latitude: ${driver.latitude}`)
            console.log(`Longitude: ${driver.longitude}`)
            console.log(`Horário: ${driver.timestamp}`)

            // Percorre a lista de linhas que o motorista está compartilhando a localização
            for (const lineId of driver.lines) {
                // Emite para os passageiros que estejam "assistindo" a localização
                socket.to(`${lineId}-${userId}`).emit("updatedDriverLocation", {latitude, longitude, timestamp:driver.timestamp})
            }

        } catch (error: any) {
            socket.emit("error", error.message || "Erro interno ao atualizar localização")
        }
    })

    socket.on("disconnect", async () => {
        logger.info(`[Socket] Desconectou: ${socket.id}`)
        try {
            const userId = socket.data.userId;
            const driverLines = getDriverLines(userId)
            for (const lineId of driverLines) {
                await DriverService.stopSharingLocation({userId, lineId})
            }
            removeDriver(userId);
        } catch (error) {
            socket.emit("error", "Erro interno ao parar compartilhamento")
        }
    })

    socket.on("connect", async () => {

    })

    socket.on("stopSharingLocation",  (lineId?: unknown|undefined) => {
        try {
            // Se foi especificada uma linha, para o compartilhamento apenas nela
            if (lineId) {
                if (typeof lineId !== "string") {
                    throw new SocketError("Linha inválida")
                }
                stopSharingLocation(socket, userId, lineId)

            } else {
                stopSharingLocation(socket, userId)

            }

        } catch (error: any) {
            socket.emit("error", error.message || "Erro interno ao parar compartilhamento")
        }
    })

}