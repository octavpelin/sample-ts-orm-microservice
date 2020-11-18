import * as express from 'express';
import Controller from '../interfaces/controller.interface';
import validationMiddleware from '../middleware/validation.middleware';
import CreateUserDto from '../users/user.dto';
import AuthenticationService from './authentication.service';
import LogInDto from './logIn.dto';
import RequestWithUser from '../interfaces/requestWithUser.interface';
import { getRepository } from 'typeorm';
import * as UserInterface from '../users/user.interface';
import User from '../users/user.entity';
import authMiddleware from '../middleware/auth.middleware';
import WrongAuthenticationTokenException from '../exceptions/WrongAuthenticationTokenException';
import TwoFactorAuthenticatorDto from './TwoFactorAuthentication.dto';

class AuthenticationController implements Controller {
    public path = '/auth';
    public router = express.Router();
    private authenticationService = new AuthenticationService();
    

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(`${this.path}/register`, validationMiddleware(CreateUserDto), this.registration);
        this.router.post(`${this.path}/login`, validationMiddleware(LogInDto), this.loggingIn);
        this.router.post(`${this.path}/logout`, this.loggingOut);
        this.router.get(`${this.path}`, authMiddleware(), this.auth);
        this.router.get(`${this.path}/2fa/generate`, authMiddleware(), this.generateTwoFactorAuthenticationCode);
        this.router.post(`${this.path}/2fa/turn-on`,validationMiddleware(TwoFactorAuthenticatorDto), authMiddleware(), this.turnOnTwoFactorAuthentication);
        this.router.post(`${this.path}/2fa/turn-off`,validationMiddleware(TwoFactorAuthenticatorDto), authMiddleware(), this.turnOffTwoFactorAuthentication);
        this.router.post(`${this.path}/2fa/authenticate`, validationMiddleware(TwoFactorAuthenticatorDto), authMiddleware(true), this.secondFactorAuthentication);
    }

    private registration = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        const user: CreateUserDto = req.body;
        console.log(user);
        try {
            const {
                cookie,
                createdUser,
            } = await this.authenticationService.register(user);

            res.setHeader('Set-Cookie', [cookie]);
            res.status(200).send(createdUser);
        } catch (error) {
            next(error);
        }
    }

    private loggingIn = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        const logIn: LogInDto = req.body;
        console.log(logIn);
        const {cookie, user} = await this.authenticationService.logIn(logIn);
        res.setHeader('Set-Cookie', [cookie]);
        if(user.isTwoFactorAuthenticationEnabled) {
            res.status(200).send({
                isTwoFactorAuthenticationEnabled: true,
            })
        } else {
            res.status(200).send(user);
        }
    }

    private loggingOut = (req: express.Request, res: express.Response) => {
        res.setHeader('Set-Cookie', ['Authorization=; HttpOnly; Path=/; Max-age=0']);
        res.sendStatus(200);
    }

    private generateTwoFactorAuthenticationCode = async (
        req: RequestWithUser,
        res: express.Response
    ) => {
        const user: UserInterface.default = req.user;

        const userRepository = getRepository(User);
        const {
            otpauthUrl,
            base32,
        } = this.authenticationService.getTwoFactorAuthenticationCode();
        await userRepository.update(user.id, {
            ...user,
            twoFactorAuthenticationCode: base32,
        });
        this.authenticationService.respondWithQRCode(otpauthUrl, res);
        
    }

    private turnOnTwoFactorAuthentication = async (
        req: RequestWithUser,
        res: express.Response,
        next: express.NextFunction,
    ) => {
        const { twoFactorAuthenticationCode } = req.body;
        const user = req.user;
        const userRepository = getRepository(User);
        const isCodeValid = await this.authenticationService.verifyTwoFactorAuthenticationCode(
            twoFactorAuthenticationCode, user
        );
        if(isCodeValid) {
            await userRepository.update(user.id, {
                ...user,
                isTwoFactorAuthenticationEnabled: true,
            });
            res.sendStatus(200);
        } else {
            next(new WrongAuthenticationTokenException());
        }
    }

    private turnOffTwoFactorAuthentication = async (
        req: RequestWithUser,
        res: express.Response,
        next: express.NextFunction,
    ) => {
        const { twoFactorAuthenticationCode } = req.body;
        const user = req.user;
        const userRepository = getRepository(User);
        const isCodeValid = await this.authenticationService.verifyTwoFactorAuthenticationCode(
            twoFactorAuthenticationCode, user
        );
        if(isCodeValid) {
            await userRepository.update(user.id, {
                ...user,
                isTwoFactorAuthenticationEnabled: false,
            });
            res.sendStatus(200);
        } else {
            next(new WrongAuthenticationTokenException());
        }
    }

    private secondFactorAuthentication = async (
        req: RequestWithUser,
        res: express.Response,
        next: express.NextFunction,
    ) => {
        const { twoFactorAuthenticationCode } = req.body;
        const user = req.user;
        console.log('user', user);
        const isCodeValid = await this.authenticationService.verifyTwoFactorAuthenticationCode(
            twoFactorAuthenticationCode, user,
        );

        if(isCodeValid) {
            const tokenData = this.authenticationService.createToken(user, true);
            res.setHeader('Set-Cookie', [this.authenticationService.createCookie(tokenData)]);
            res.send({
                ...user,
                password: undefined,
                twoFactorAuthenticationCode: undefined
            });
        } else {
            next(new WrongAuthenticationTokenException());
        }
    }

    private auth = (req: RequestWithUser, res: express.Response) => {
        res.send({
            ...req.user,
            password: undefined,
            twoFactorAuthenticationCode: undefined,
        });
    }
    
}

export default AuthenticationController;