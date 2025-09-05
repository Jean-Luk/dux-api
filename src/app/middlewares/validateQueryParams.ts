import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { QueryParamField } from '../../types';

export function validateQueryParams(expectedQueryParams?: QueryParamField[])  {   
    return (req: Request, res: Response, next: NextFunction) => {

        if(!expectedQueryParams || expectedQueryParams.length === 0) {
            return next()
        }
        const params = req.query;
        for (const expectedParam of expectedQueryParams) {

            const value = params[expectedParam.name];
            // Se o parâmetro não existe
            if (value === null || value === undefined) {
                // Se ele é obrigatório, lança erro
                if (expectedParam.required) {
                    throw new AppError(`Parâmetro ${expectedParam.name} é obrigatório`, 400)
                }
                continue;
            }
            let parsedValue: any = value;
            // Se espera um campo array
            switch (expectedParam.type) {
                case "array":
                    if(!Array.isArray(value)) {
                        parsedValue = [value]
                    }
                    break;
                case "boolean":
                    if(
                        value !== "true" &&
                        value !== "false"
                    ) {
                        throw new AppError(`Parâmetro ${expectedParam.name} inválido`, 400)
                    }
                    parsedValue = value === "true";
                    break;
                case "number":
                    parsedValue = Number(value);
                    if (isNaN(parsedValue)) {
                        throw new AppError(`Parâmetro ${expectedParam.name} inválido`, 400)
                    }
                case "string":
                default:
                    parsedValue = String(value);
            }

            if (expectedParam.possibleValues) {
                if (!expectedParam.possibleValues.includes(parsedValue)) {
                    throw new AppError(`Parâmetro ${expectedParam.name} possui valor ${parsedValue} mas deve ser: [${expectedParam.possibleValues.join(", ")}]`, 400)
                }
            }
        }

        next();
    }
}