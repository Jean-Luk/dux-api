import { Router } from 'express';
import fg from 'fast-glob';
import path from 'path';
import { RouteDefinition } from '../../types';
import { validateBody } from '../middlewares/validateBody';
import { validateQueryParams } from '../middlewares/validateQueryParams';
import { requirePermission } from '../middlewares/requirePermissions';

const router = Router();

// Buscar todos os arquivos que terminam com .routes.{ts, js}
const routeFiles = fg.sync(['**/*.routes.{ts,js}'], {
	cwd: __dirname,
	absolute: true,
});

for (const file of routeFiles) {
	const routeModule = require(file);
	const routes = routeModule.default;

	const fileName = path.basename(file);
	const prefix = '/' + fileName.split('.')[0];

	// Verifica se é um arquivo válido de rotas:
	// (No build do projeto, há outros arquivos dentro da pasta que entram na busca mas não são válidos)
	if (!Array.isArray(routes) || !routes[0].method) {
        continue;
    }

	for(const route of routes as RouteDefinition[]) {
		const { method, path, controller, middlewares=[], body, queryParams, requiredPermissions } = route;

		const middlewaresToAdd = [];
		if (body) {
			middlewaresToAdd.push(validateBody(body))
		}
		if(queryParams) {
			middlewaresToAdd.push(validateQueryParams(queryParams))
		}
		if(requiredPermissions) {
			middlewaresToAdd.push(requirePermission(requiredPermissions))
		}

		router[method](
			`${prefix}${path}`, 
			...middlewares, 
			...middlewaresToAdd, 
			controller
		)
	}
}

export default router;
