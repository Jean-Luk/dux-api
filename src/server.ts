import app from './app/app';
import logger from './config/logger';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Rodando na porta ${PORT}`);
});
