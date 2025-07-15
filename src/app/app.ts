import express from 'express';
import authRoutes from './routes/auth.routes'
import { errorHandler } from './middlewares/errorHandler';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { User } from '@prisma/client';
import { AppError } from './utils/AppError';

const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || [];
const isDev = process.env.ENVIRONMENT !== 'PROD';

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

app.use(express.json());
app.use(cookieParser());

// Rotas:
app.use('/auth', authRoutes)


app.use(errorHandler);

export default app;
