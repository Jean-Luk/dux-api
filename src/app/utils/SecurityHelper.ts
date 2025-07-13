import bcrypt from 'bcrypt';
import crypto from 'crypto';

export class SecurityHelper {
    static async generateSalt(rounds: number = 10): Promise<string> {
        return await bcrypt.genSalt(rounds);
    }
 
    static async generateHashPassword(password: string, salt: string): Promise<string> {
        return await bcrypt.hash(password, salt);
    }

    static async checkPassword(password: string, hashed: string): Promise<boolean> {
	    return await bcrypt.compare(password, hashed);
    }

    static generateAuthToken(userId: string): string {
        const randomPart = crypto.randomBytes(32).toString('hex'); // 64 caracteres
        const token = `${userId}.${randomPart}`;
        return token;
    }

}
