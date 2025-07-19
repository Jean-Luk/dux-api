import { Request, Response, NextFunction } from 'express';

export function validateBody(req: Request, res: Response, next: NextFunction)  {   
    if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ error: 'Corpo da requisição inválido ou ausente' });
    }

    next();
}
