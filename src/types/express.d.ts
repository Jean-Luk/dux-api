import { Manager, User } from '@prisma/client';

declare global {
	namespace Express {
		interface Request {
			user?: User;
			manager?: Manager
		}
	}
}
