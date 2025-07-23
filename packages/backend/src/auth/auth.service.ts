import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { User } from '../user/entities/user.entity';
import { CacheManagerStore } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

/**
 * Payload used for generating an access token.
 *
 * @property sub - Subject (typically the user ID)
 * @property jti - Unique token identifier (used to track/revoke tokens)
 * @property wallet_address - The user's wallet address
 * @property exp - Optional expiration timestamp (added automatically by JWT library if not provided)
 */
export interface AccessTokenPayload {
  sub: string;
  jti: string;
  wallet_address: string;
  exp?: number;
}

/**
 * Payload used for generating a refresh token.
 *
 * @property sub - Subject (typically the user ID)
 * @property jti - Unique token identifier
 * @property iat - Issued-at timestamp
 * @property exp - Optional expiration timestamp
 */
export interface RefreshTokenPayload {
  sub: string;
  jti: string;
  iat: number;
  exp?: number;
}

@Injectable()
export class AuthService {
  logger = new Logger('AuthService');

  constructor(
    @Inject(JwtService) private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cache: CacheManagerStore,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Extracts the refresh token from the request cookies.
   *
   * @param request - The incoming HTTP request
   * @returns The refresh token string if present, otherwise null
   */
  static extractRefreshTokenFromHeader(request: Request) {
    return request.cookies['refresh_token'] as string | null;
  }

  /**
   * Extracts the access token from the Authorization header (Bearer scheme).
   *
   * @param request - The incoming HTTP request
   * @returns The access token string if present, otherwise null
   */
  static extractAccessTokenFromHeader(request: Request) {
    return request.headers.authorization?.replace('Bearer ', '') ?? null;
  }

  /**
   * Generates a signed JWT access token using the provided payload.
   *
   * @param payload - The access token payload
   * @returns A signed JWT access token string
   */
  generateAccessToken(payload: AccessTokenPayload) {
    return this.jwtService.sign(payload, {
      expiresIn: this.config.get('auth.accessTokenTTL'),
    });
  }

  /**
   * Generates a signed JWT refresh token using the provided payload.
   *
   * @param payload - The refresh token payload
   * @returns A signed JWT refresh token string
   */
  generateRefreshToken(payload: RefreshTokenPayload) {
    return this.jwtService.sign(payload, {
      expiresIn: this.config.get('auth.refreshTokenTTL'),
    });
  }

  /**
   * Signs user in, generates refresh and access tokens.
   *
   * @param user – The user entity obtained from User db.
   * @returns {Promise<{
   *    accessToken: string,
   *    refreshToken: string,
   *    refreshTokenTTL: number,
   *    accessTokenTTL: number
   * }>}
   * */
  async signIn(user: User): Promise<{
    accessToken: string;
    refreshToken: string;
    refreshTokenTTL: number;
    accessTokenTTL: number;
  }> {
    const accessTokenPayload: AccessTokenPayload = {
      wallet_address: user.wallet_address as string,
      sub: user.id,
      jti: crypto.randomUUID(),
    };

    const nowInSeconds = Math.floor(Date.now() / 1000);

    const refreshTokenPayload: RefreshTokenPayload = {
      sub: user.id,
      jti: crypto.randomUUID(),
      iat: nowInSeconds,
    };

    const accessToken = this.generateAccessToken(accessTokenPayload);
    const refreshToken = this.generateRefreshToken(refreshTokenPayload);

    await this.cache.set(
      `refresh_token:${refreshTokenPayload.jti}`,
      accessTokenPayload.sub,
      refreshTokenPayload.iat,
    );

    const refreshTokenTTL = this.config.get('auth.refreshTokenTTL') as number;
    const accessTokenTTL = this.config.get('auth.accessTokenTTL') as number;
    return { refreshTokenTTL, accessTokenTTL, accessToken, refreshToken };
  }

  /**
   * Removes the refreshToken from cache and blacklists the accessToken
   *
   * @param accessToken – The user bearer token
   * @param refreshToken – The refresh token used to generate a new access token
   * */
  async signOut(accessToken: string | null, refreshToken: string | null) {
    if (refreshToken) {
      // If the verification will fail, let the controller handle the error
      const payload: RefreshTokenPayload =
        await this.jwtService.verifyAsync(refreshToken);
      // Delete the refresh token, so the existing ones can't be used no more.
      // This service
      await this.cache.del(`refresh_token:${payload.jti}`);
    }

    if (accessToken) {
      const accessTokenPayload: AccessTokenPayload =
        await this.jwtService.verifyAsync(accessToken);
      // Store the jti in cache with its remaining expiry time
      const remainingExpiry = (accessTokenPayload.exp || 0) * 1000 - Date.now();
      await this.cache.set(
        `blacklisted_access_token:${accessTokenPayload.jti}`,
        accessToken,
        remainingExpiry,
      );
    }
  }

  /**
   * Refreshes the accessToken and returns a new refresh token if the refresh token expiry - threshold >= now
   *
   * @param accessToken – The user bearer token
   * @param refreshToken – The refresh token used to generate a new access token
   * */
  async refresh(refreshToken: string, accessToken: string | null) {
    // 1. Verify the integrity of the refresh token
    let refreshTokenPayload: RefreshTokenPayload;
    try {
      refreshTokenPayload = await this.jwtService.verifyAsync(refreshToken);
    } catch (err) {
      throw new UnauthorizedException(err, {
        description: 'The refresh token provided, is invalid',
      });
    }

    // 2. Invalidate the existing access token
    let accessTokenPayload: AccessTokenPayload | null = null;
    if (accessToken) {
      try {
        accessTokenPayload =
          await this.jwtService.verifyAsync<AccessTokenPayload>(accessToken);
        const remainingExpiry =
          (accessTokenPayload.exp || 0) * 1000 - Math.floor(Date.now());
        await this.cache.set(
          `blacklisted_access_token:${accessTokenPayload.jti}`,
          accessToken,
          remainingExpiry,
        );
      } catch (err) {
        // Instead of throwing an error, just log it to the console, and continue running.
        // Because the user has a valid refresh token, it might happen frontend to fail refreshing the token on time.
        this.logger.warn(err);
      }
    }

    // 3. Generate a new refresh token if needed
    const refreshTokenThreshold = this.config.get(
      'auth.refreshTokenExpiryThreshold',
    ) as number;
    const remainingRefreshTokenExpiry =
      (refreshTokenPayload.exp ?? 0) - Math.floor(Date.now() / 1000);
    let newRefreshToken: string | null = null;
    if (remainingRefreshTokenExpiry <= refreshTokenThreshold) {
      await this.cache.del(`refresh_token:${refreshTokenPayload.jti}`);
      const payload: RefreshTokenPayload = {
        sub: refreshTokenPayload.sub,
        iat: Math.floor(Date.now()),
        jti: crypto.randomUUID(),
      };
      newRefreshToken = this.generateRefreshToken(payload);
      await this.cache.set(
        `refresh_token:${refreshTokenPayload.jti}`,
        newRefreshToken,
      );
    }

    // 4. Generate the new access token

    if (!accessTokenPayload) {
      const user = await this.userRepository.findOne({
        where: { id: refreshTokenPayload.sub },
      });
      if (!user) {
        throw new NotFoundException(
          `User ${refreshTokenPayload.sub} not found`,
        );
      }

      accessTokenPayload = {
        sub: user.id,
        wallet_address: user.wallet_address as string,
        jti: crypto.randomUUID(),
      };
    } else {
      accessTokenPayload.jti = crypto.randomUUID();
    }

    const newAccessToken = this.generateAccessToken({
      sub: accessTokenPayload.sub,
      wallet_address: accessTokenPayload.wallet_address,
      jti: accessTokenPayload.jti,
    });

    return { newRefreshToken: newRefreshToken, newAccessToken: newAccessToken };
  }
}
