import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';

export class SessionController {
    static async login(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await AuthService.login(req.body);

            res.status(200).cookie('dux_auth_token', result.authToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                maxAge: 1000 * 60 * 60 * 24 // 1 dia
            }).end();

        } catch (err) {
            next(err);
        }
    }

    static async me(req: Request, res: Response, next: NextFunction) {
        try {
            const result = req.user ?? {};

            res.status(200).json(result);

        } catch (err) {
            next(err);
        }
    }

    static async logout(req: Request, res: Response, next: NextFunction) {
        try {
            const authToken = req.cookies["dux_auth_token"]

            await AuthService.logout({authToken});
            
            res.clearCookie("dux_auth_token").sendStatus(204);

        } catch (err) {
            next(err);
        }
    }

}
