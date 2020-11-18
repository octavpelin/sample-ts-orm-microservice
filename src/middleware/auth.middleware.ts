import { NextFunction, RequestHandler, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { getRepository } from 'typeorm';
import AuthenticationTokenMissingException from '../exceptions/AuthenticationTokenMissingException';
import WrongAuthenticationTokenException from '../exceptions/WrongAuthenticationTokenException';
import DataStoredInToken from '../interfaces/dataStoredInToken.interface';
import RequestWithUser from '../interfaces/requestWithUser.interface';
import User from '../users/user.entity';

function authMiddleware(omitSecondFactor = false): RequestHandler {
    return async (req: RequestWithUser, res: Response, next: NextFunction) => {
        const cookies = req.cookies;
        const userRepository = getRepository(User);
        console.log(cookies);
        if(cookies && cookies.Authorization) {
            const secret = process.env.JWT_SECRET;
            try {
                const verificationResponse = jwt.verify(cookies.Authorization, secret) as DataStoredInToken;
                console.log(verificationResponse)
                const {id, isSecondFactorAuthenticated} = verificationResponse;
                const user = await userRepository.findOne(id);
                if(user) {
                    if(!omitSecondFactor && user.isTwoFactorAuthenticationEnabled && !isSecondFactorAuthenticated) {
                        next(new WrongAuthenticationTokenException());
                    } else {
                        req.user = user;
                        next();
                    }
                } else {
                    next(new WrongAuthenticationTokenException());
                }
            } catch (error) {
                next(new WrongAuthenticationTokenException());
            }
        } else {
            next(new AuthenticationTokenMissingException());
        }
    }
}

export default authMiddleware;