import { Router } from 'express';
import fg from 'fast-glob';
import path from 'path';
import { RouteDefinition } from '../../types';
import { validateBody } from '../middlewares/validateBody';
import { validateQueryParams } from '../middlewares/validateQueryParams';

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

	for(const route of routes as RouteDefinition[]) {
		const { method, path, controller, middlewares=[], body, queryParams } = route;
		const middlewaresToAdd = [];
		if (body) {
			middlewaresToAdd.push(validateBody(body))
		}
		if(queryParams) {
			middlewaresToAdd.push(validateQueryParams(queryParams))
		}
		router[method](
			`${prefix}${path}`, 
			...middlewaresToAdd, 
			...middlewares, 
			controller
		)
	}
}

export default router;
