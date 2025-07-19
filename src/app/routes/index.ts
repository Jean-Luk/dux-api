import { Router } from 'express';
import fg from 'fast-glob';
import path from 'path';
import logger from '../../config/logger';

const router = Router();

// Buscar todos os arquivos que terminam com .routes.{ts, js}
const routeFiles = fg.sync(['**/*.routes.{ts,js}'], {
	cwd: __dirname,
	absolute: true,
});

for (const file of routeFiles) {
	const routeModule = require(file);
	const exportedRouter = routeModule.default;

	if (!exportedRouter) {
		logger.warn(`Arquivo ${file} não exporta um router Express`);
		continue;
	}

	// Derivar prefixo a partir do nome do arquivo (ex: auth.routes.ts -> /auth)
	const fileName = path.basename(file);
	const prefix = '/' + fileName.split('.')[0];

	router.use(prefix, exportedRouter);
}

export default router;
