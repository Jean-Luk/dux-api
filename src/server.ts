import { createServer } from 'http';
import app from './app/app';
import logger from './config/logger';
import dotenv from 'dotenv';
import { initSocket } from './app/socket';

dotenv.config();

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST?.toLowerCase() === "true";

const server = createServer(app);
initSocket(server);

server.listen(Number(PORT), HOST ? "0.0.0.0" : "localhost", () => {
  logger.info(`Servidor rodando em ${HOST ? "0.0.0.0" : "localhost"}:${PORT}`);
});
