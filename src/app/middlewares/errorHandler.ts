import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import logger from '../../config/logger';


export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
   
    if (err instanceof AppError) {
        if (err.statusCode >= 500) {
            logger.error(err);
        // } else {
            // logger.warn(err);
        }
        
        return res.status(err.statusCode).json({ error: err.message });
    }

    logger.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
}
