import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import upload from '../../config/multer';

export function handleFileUpload(req: Request, res: Response, next: NextFunction) {
    try {
        const uploadSingle = upload.single("file");
        
        
        uploadSingle(req, res, (error) => {
            try {
                if (error) {
                    throw new AppError(error.message || "Erro ao fazer upload do arquivo", 400)
                }

                next();
            } catch (error: any) {
                throw new AppError(error.message || 'Erro interno ao fazer upload do arquivo', error.statusCode || 500);
            }
        })
        
        // next();
    } catch (error : any) {
        throw new AppError(error.message || 'Erro interno ao fazer upload do arquivo', error.statusCode || 500);
    }
}
