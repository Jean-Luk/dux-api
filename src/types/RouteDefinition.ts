import { RequestHandler } from 'express';
import { PermissionEnum } from './enums';

export type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch';

export type PrimitiveValue = string | number | boolean;

export type BodyField = { 
    name: string; 
    type: 'string'|'number'|'boolean'|'array'; 
    required?: boolean; 
    possibleValues?: PrimitiveValue[] 
}

export type QueryParamField = {
    name: string;
    type: 'string'|'number'|'boolean'|'array';
    required?: boolean;
    possibleValues?: PrimitiveValue[];
}

export interface RouteDefinition {
    method: HttpMethod;
    path: string;
    controller: RequestHandler;
    middlewares?: RequestHandler[];
    requiredPermissions?: PermissionEnum[];
    body?: BodyField[];
    queryParams?: QueryParamField[];
}
