import express from 'express';
import routes from './routes/'
import { errorHandler } from './middlewares/errorHandler';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { AppError } from './utils/AppError';

declare global {
    interface BigInt {
        toJSON(): Number;
    }
}
// Tratativa para converter BigInt's para JSON
BigInt.prototype.toJSON = function () { return Number(this) }

export const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || [];
export const isDev = process.env.ENVIRONMENT !== 'PROD';

const app = express();

app.use(cors({
	origin: (origin, callback) => {
        // No ambiente dev permite requisições sem origem
		if (!origin) {
            if (isDev) {
                return callback(null, true);
            }
            return callback(new AppError('Unauthorized'));
        } else {
            // Verifica se origem está no array de permitidas
            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(new AppError('Unauthorized'));
        }
    },
	credentials: true
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Rotas:
app.use(routes)


app.use(errorHandler);

export default app;
