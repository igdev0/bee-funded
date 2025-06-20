import {
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AccessTokenPayload, AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { UserService } from '../user/user.service';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';

export class AuthGuard implements CanActivate {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const token = AuthService.extractTokenFromHeader(request);

    if (!token || token === 'undefined') {
      throw new UnauthorizedException('No token provided');
    }
    const payload: AccessTokenPayload = await this.jwtService.verifyAsync(
      token,
      {
        secret: this.config.get('JWT_SECRET'),
      },
    );

    const blackListed = await this.redis.get(
      `blacklisted_access_token:${payload.jti}`,
    );

    if (blackListed) {
      throw new UnauthorizedException('This token was blacklisted');
    }

    const user = await this.userService.findUserByID(payload.sub);
    if (!user) {
      return false;
    }
    request['user'] = user;

    return true;
  }
}
