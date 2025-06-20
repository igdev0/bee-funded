import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

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


@Injectable()
export class AuthService {
  constructor(
    @Inject(JwtService) private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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
}
