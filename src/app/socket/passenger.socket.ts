import { Socket } from "socket.io";
import { LineService } from "../services/line.service";
import { SocketError } from "../utils/SocketError";

export default function setupPassengerEvents (socket: Socket) {
    const userId = socket.data.userId;

    socket.on("startWatchingDriver", async (lineId, driverId) => {
        try {
            if (!lineId || typeof lineId !== "string") {
                throw new SocketError("Linha inválida")
            }
    
            if (!driverId || typeof driverId !== "number") {
                throw new SocketError("ID de motorista inválido")
            }
            console.log(driverId)
            const driver = await LineService.getDriverIfPassengerAuthorized({lineId, driverId, passengerUserId:userId})
    
            // Linha ou motorista não existem, ou passageiro não está autorizado
            if (!driver) {
                throw new SocketError("Linha ou motorista inexistentes")
            }
            console.log(driver);
            // Verifica se o motorista está compartilhando localização
            if (!driver.sharingLocation) {
                throw new SocketError("Este motorista não está mais compartilhando localização")
            }

            socket.join(`${lineId}-${driver.userId}`);

        } catch (error: any) {
            socket.emit("error", error.message || "Erro interno ao acompanhar motorista");
        }
    })

    socket.on("stopWatchingDriver", async (lineId, driverId) => {
        try {
            if (lineId && driverId) {
                if (typeof lineId !== "string") {
                    throw new SocketError("Linha inválida")
                }
        
                if (typeof driverId !== "number") {
                    throw new SocketError("ID de motorista inválido")
                }
        
                const driver = await LineService.getDriverIfPassengerAuthorized({lineId, driverId, passengerUserId:userId})
        
                // Linha ou motorista não existem, ou passageiro não está autorizado
                if (!driver) {
                    throw new SocketError("Linha ou motorista inexistentes")
                }
    
                socket.rooms.delete(`${lineId}-${driver.userId}`);

            } else {
                socket.rooms.clear();
            }

        } catch (error: any) {
            socket.emit("error", error.message || "Erro interno ao parar de acompanhar motorista");
        }
    })

    socket.on("disconnect", async () => {
        try {
            socket.rooms.clear();
        } catch (error) {
            socket.emit("error", "Erro interno ao desconectar passageiro")
        }
    })

    socket.on("connect", async () => {

    })
}