import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { getRepository } from 'typeorm';
import { Response } from 'express';
import UserWithThatEmailAlreadyExistsException from '../exceptions/UserWithThatEmailAlreadyExistsException';
import WrongCredentialsException from '../exceptions/WrongCredentialsException';
import DataStoredInToken from 'interfaces/dataStoredInToken.interface';
import TokenData from 'interfaces/tokenData.interface';
import CreateUserDto from '../users/user.dto';
import User from '../users/user.entity';
import * as UserInterface from '../users/user.interface';
import LogInDto from './logIn.dto';
import RequestWithUser from 'interfaces/requestWithUser.interface';

class AuthenticationService {
  private userRepository = getRepository(User);

  public async register(userData: CreateUserDto) {
    console.log(userData);
    if (
            await this.userRepository.findOne({ email: userData.email })
        ) {
      throw new UserWithThatEmailAlreadyExistsException(userData.email);
    }
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const createdUser = await this.userRepository.create({
      ...userData,
      password: hashedPassword,
    });
    await this.userRepository.save(createdUser);
    createdUser.password = undefined;
    const tokenData = this.createToken(createdUser);
    const cookie = this.createCookie(tokenData);
    return {
      cookie,
      createdUser,
    };

  }

  getTwoFactorAuthenticationCode = () => {
    const secretCode = speakeasy.generateSecret({
      name: process.env.TWO_FACTOR_AUTHENTICATION_APP_NAME,
    });
    return {
      otpauthUrl: secretCode.otpauth_url,
      base32: secretCode.base32,
    };
  }

  public verifyTwoFactorAuthenticationCode(twoFactorAuthenticationCode: string,
                                           user: UserInterface.default) {
            // User interface or entity
    return speakeasy.totp.verify({
      secret: user.twoFactorAuthenticationCode,
      encoding: 'base32',
      token: twoFactorAuthenticationCode,
    });
  }

  respondWithQRCode = (data: string, response: Response) => {
    QRCode.toFileStream(response, data);
  }

  public async logIn(logIn: LogInDto) {
    console.log(logIn);
    const user = await this.userRepository.findOne({ email: logIn.email });
    if (user) {
      const isPasswordMatching = await bcrypt.compare(logIn.password, user.password);
      if (isPasswordMatching) {
        user.password = undefined;
        user.twoFactorAuthenticationCode = undefined;
        const tokenData = this.createToken(user);
        const cookie = this.createCookie(tokenData);
        return {
          cookie,
          user,
        };
      }
      throw new WrongCredentialsException();

    } else {
      throw new WrongCredentialsException();
    }
  }

  public createCookie(tokenData: TokenData) {
    return `Authorization=${tokenData.token}; HttpOnly; Path=/; Max-Age=${tokenData.expiresIn}`;
  }

  public createToken(user: UserInterface.default, isSecondFactorAuthenticated: boolean = false): TokenData {
    const expiresIn = 4 * 60 * 60; // an hour
    const secret = process.env.JWT_SECRET;
    const dataStoredInToken: DataStoredInToken = {
      isSecondFactorAuthenticated,
      id: user.id,
    };
    return {
      expiresIn,
      token: jwt.sign(dataStoredInToken, secret, { expiresIn }),
    };
  }
}

export default AuthenticationService;
