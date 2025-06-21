import {
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import * as uuidv4 from 'uuid';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { UserService } from '../user/user.service';
import * as process from 'node:process';

export interface AccessTokenPayload {
  sub: string;
  jti: string;
  username: string;
  email: string;
  exp?: number;
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
  iat: number;
  exp?: number;
}

export const REFRESH_TOKEN_TTL = 60 * 60 * 24 * 7; // 7 days
export const REFRESH_TOKEN_EXPIRY_THRESHOLD_SECONDS = 60 * 60 * 24; // 24 hours
export const ACCESS_TOKEN_TTL = 60 * 15 * 1000;
export const COOKIE_SECURE = process.env.NODE_ENV === 'production';

@Injectable()
export class AuthService {
  constructor(
    @Inject(JwtService) private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRedis() private readonly redis: Redis,
    @Inject(UserService) private readonly userService: UserService,
  ) {}

  generateAccessToken(payload: AccessTokenPayload) {
    return this.jwtService.sign(payload, {
      expiresIn: ACCESS_TOKEN_TTL,
      secret: this.configService.get('JWT_SECRET'),
    });
  }

  generateRefreshToken(payload: RefreshTokenPayload) {
    return this.jwtService.sign(payload, {
      expiresIn: REFRESH_TOKEN_TTL,
      secret: this.configService.get('JWT_SECRET'),
    });
  }

  static extractTokenFromHeader(request: Request): string | undefined {
    return request.cookies['access_token'] as string | undefined;
  }

  async handleRefresh(refreshToken: string, res: Response) {
    if (!refreshToken) {
      return res.status(HttpStatus.BAD_REQUEST).send();
    }

    try {
      const payload: RefreshTokenPayload = await this.jwtService.verifyAsync(
        refreshToken,
        { secret: this.configService.get('JWT_SECRET') },
      );

      const user = await this.userService.findUserByID(payload.sub);

      if (!user) {
        res.clearCookie('refresh_token');
        return res
          .status(HttpStatus.BAD_REQUEST)
          .send({ message: 'Invalid refreshToken' });
      }

      const newAccessToken = this.generateAccessToken({
        sub: user.id as string,
        email: user.email,
        username: user.email,
        jti: uuidv4.v4(),
      });
      const currentTimeInSeconds = Math.floor(Date.now() / 1000);

      if (
        payload.exp && // Ensure exp exists on the payload (it should from verifyAsync)
        payload.exp - currentTimeInSeconds <
          REFRESH_TOKEN_EXPIRY_THRESHOLD_SECONDS
      ) {
        await this.redis.del(`refresh_token:${payload.jti}`);
        const nowInSeconds = Math.floor(Date.now() / 1000);
        const newPayload = {
          sub: user.id as string,
          jti: uuidv4.v4(),
          iat: nowInSeconds,
        };
        const refreshToken = this.generateRefreshToken(newPayload);
        await this.redis.set(
          `refresh_token:${newPayload.jti}`,
          user.id as string,
          'EX',
          REFRESH_TOKEN_TTL,
        );

        res.cookie('refresh_token', refreshToken, {
          httpOnly: true,
          secure: COOKIE_SECURE,
          sameSite: 'strict',
          maxAge: REFRESH_TOKEN_TTL * 1000,
        });
        res.clearCookie('access_token', {
          httpOnly: true,
          secure: COOKIE_SECURE,
          sameSite: 'strict',
        });
      }

      // payload.exp
      return newAccessToken;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
