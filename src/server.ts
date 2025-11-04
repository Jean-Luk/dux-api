import app from './app/app';
import logger from './config/logger';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST?.toLowerCase() === "true";

app.listen(Number(PORT), HOST ? "0.0.0.0" : "localhost", () => {
  logger.info(`Servidor rodando em ${HOST ? "0.0.0.0" : "localhost"}:${PORT}`);
});
