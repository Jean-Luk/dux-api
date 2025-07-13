import express from 'express';
import authRoutes from './routes/auth.routes'
import { errorHandler } from './middlewares/errorHandler';
import cookieParser from 'cookie-parser';

// import cors from 'cors';
// import your routes here

const app = express();

// app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Rotas:
app.use('/auth', authRoutes)


app.use(errorHandler);

export default app;
