import { Manager, User } from '@prisma/client';
import { RoleEnum } from './enums';
import { RequestUser } from './RequestUser';

declare global {
	namespace Express {
		interface Request {
			user?: RequestUser;
		}
	}
}
