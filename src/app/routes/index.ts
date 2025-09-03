import { Router } from 'express';
import fg from 'fast-glob';
import path from 'path';
import { RouteDefinition } from '../../types';
import { validateBody } from '../middlewares/validateBody';

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
		const { method, path, controller, middlewares=[], body } = route;
		if (body) {
			router[method](`${prefix}${path}`, validateBody(body), ...middlewares, controller)
		} else {
			router[method](`${prefix}${path}`, ...middlewares, controller)
		}
	}
}

export default router;
