import { Request, Response, NextFunction } from 'express';
import { BodyField } from '../../types/RouteDefinition';
import { AppError } from '../utils/AppError';

export function validateBody(expectedBody?: BodyField[])  {   
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.body || typeof req.body !== 'object') {
            return res.status(400).json({ error: 'Corpo da requisição inválido ou ausente' });
        }

        if(expectedBody) {
            const body = req.body;
            for (const expectedField of expectedBody) {
    
                const field = body[expectedField.name];
                // Se o field não existe no body
                if (field === null || field === undefined) {
                    // Se ele é obrigatório, lança erro
                    if (expectedField.required) {
                        throw new AppError(`Parâmetro ${expectedField.name} é obrigatório`, 400)
                    }
                    continue;
                }
                
                // Se espera um campo array
                if(expectedField.type === "array") {
                    // Se não é um array, lança erro
                    if(!Array.isArray(field)) {
                        throw new AppError(`Parâmetro ${expectedField.name} deve ser um array`, 400)
                    }
    
                    // Se possui lista de possíveis valores
                    if(expectedField.possibleValues) {
                        // Verifica se cada valor do array está na lista de possíveis valores
                        for (const value of field) {
                            if (!(expectedField.possibleValues.includes(value))) {
                                // Caso não seja um dos valores possíveis, lança erro
                                throw new AppError(`Parâmetro ${expectedField.name} possui valor ${value} mas deve ser: [${expectedField.possibleValues.join(", ")}]`, 400)
                            }
                        }
                    }
    
                } else {
                    // Verifica se o tipo do campo é válido
                    if(typeof(field) !== expectedField.type) {
                        throw new AppError(`Parâmetro ${expectedField.name} é do tipo ${typeof(field)} mas deve ser ${expectedField.type}`, 400)
                    }
    
                    if (expectedField.possibleValues && !(expectedField.possibleValues.includes(field))) {
                        throw new AppError(`Parâmetro ${expectedField.name} possui valor ${field} mas deve ser: [${expectedField.possibleValues.join(", ")}]`, 400)
                    }
    
                }
            }
        }
        next();
    }
}