import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  AccessTokenPayload,
  AuthService,
  REFRESH_TOKEN_EXPIRY_THRESHOLD_SECONDS,
  REFRESH_TOKEN_TTL,
  RefreshTokenPayload,
} from './auth.service';
import { generateNonce, SiweMessage } from 'siwe';
import { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { SignupDto } from './dto/signup.dto';
import ExistsDto from './dto/exists.dto';
import * as uuidv4 from 'uuid';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { GetUser } from '../decorators/get-user.decorator';
import { AuthGuard } from './auth.guard';
import { User } from '../user/entities/user.entity';
import SigninDto from './dto/signin.dto';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly config: ConfigService,
    @InjectRedis()
    private readonly redis: Redis,
  ) {}

  @Get('nonce')
  async getNonce(@Res() res: Response) {
    const nonce = generateNonce();
    await this.redis.set(nonce, 'valid');
    res.status(HttpStatus.OK).send({ nonce });
  }

  @Post('exists')
  async exists(@Body() body: ExistsDto) {
    return !!(await this.userService.findUserByAddress(body.address));
  }

  @Post('signup')
  async signUp(
    @Body()
    body: SignupDto,
    @Res() res: Response,
  ) {
    const nonceStatus = await this.redis.get(body.nonce);

    if (!nonceStatus)
      return res
        .status(HttpStatus.UNPROCESSABLE_ENTITY)
        .send({ error: 'Invalid nonce' });

    try {
      const siweMessage = new SiweMessage(body.message);
      const siweResponse = await siweMessage.verify({
        nonce: body.nonce,
        signature: body.signature,
      });

      if (siweResponse.error) {
        return res.status(HttpStatus.BAD_REQUEST).send(siweResponse.error);
      }

      const user = await this.userService.register({
        address: siweMessage.address,
        username: body.username,
        email: body.email,
        complete: false,
        accepted_terms: body.accepted_terms,
      });

      const accessTokenPayload: AccessTokenPayload = {
        sub: user.id as string,
        username: user.username,
        email: user.email,
        jti: uuidv4.v4(),
      };

      const nowInSeconds = Math.floor(Date.now() / 1000);

      const refreshTokenPayload: RefreshTokenPayload = {
        sub: user.id as string,
        jti: uuidv4.v4(),
        iat: nowInSeconds,
      };
      // this.jwtService.
      // Create session (e.g., JWT or cookie)
      const accessToken =
        this.authService.generateAccessToken(accessTokenPayload);
      const refreshToken =
        this.authService.generateRefreshToken(refreshTokenPayload);
      await this.redis.set(
        `refresh_token:${refreshTokenPayload.jti}`,
        accessTokenPayload.sub,
      );

      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: REFRESH_TOKEN_TTL,
      });

      res.status(HttpStatus.OK).send({ accessToken });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      res.status(HttpStatus.BAD_REQUEST).send({ error: 'Invalid signature' });
    }
  }

  @Post('signin')
  async signIn(
    @Req() req: Request,
    @Body()
    body: SigninDto,
    @Res() res: Response,
  ) {
    const nonceStatus = await this.redis.get(body.nonce);
    if (!nonceStatus)
      return res
        .status(HttpStatus.UNPROCESSABLE_ENTITY)
        .send({ error: 'Invalid nonce' });

    const user = await this.userService.findUserByAddress(body.address);
    if (!user) {
      return res
        .status(HttpStatus.NOT_FOUND)
        .send({ error: "Couldn't find user" });
    }

    try {
      const siweMessage = new SiweMessage(body.message);
      const siweResponse = await siweMessage.verify({
        nonce: body.nonce,
        signature: body.signature,
      });

      if (siweResponse.error) {
        return res.status(HttpStatus.BAD_REQUEST).send(siweResponse.error);
      }

      const accessTokenPayload = {
        sub: user.id as string,
        username: user.username,
        email: user.email,
        jti: uuidv4.v4(),
      };
      const nowInSeconds = Math.floor(Date.now() / 1000);

      const refreshTokenPayload = {
        sub: user.id as string,
        jti: uuidv4.v4(),
        iat: nowInSeconds,
      };
      // this.jwtService.
      // Create session (e.g., JWT or cookie)
      const accessToken =
        this.authService.generateAccessToken(accessTokenPayload);
      const refreshToken =
        this.authService.generateRefreshToken(refreshTokenPayload);

      await this.redis.set(
        `refresh_token:${refreshTokenPayload.jti}`,
        accessTokenPayload.sub,
      );

      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: REFRESH_TOKEN_TTL,
      });

      res.status(HttpStatus.OK).send({ accessToken });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      res.status(HttpStatus.BAD_REQUEST).send({ error: 'Invalid signature' });
    }
  }

  @Post('signout')
  async signOut(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies['refresh_token'] as string;
    const accessToken = this.extractTokenFromHeader(req); // Bearer token
    if (refreshToken) {
      try {
        const payload: RefreshTokenPayload = await this.jwtService.verifyAsync(
          refreshToken,
          {
            secret: this.config.get('JWT_SECRET'),
          },
        );

        // Delete the refresh token from Redis
        await this.redis.del(`refresh_token:${payload.jti}`);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        // If the refresh token is invalid/expired, we still want to clear the cookie
        console.warn('Attempted to sign out with invalid refresh token.');
      }
    }

    if (accessToken) {
      try {
        const accessPayload: AccessTokenPayload =
          await this.jwtService.verifyAsync(accessToken, {
            secret: this.config.get('JWT_SECRET'),
          });
        // Store the jti in Redis with its remaining expiry time
        const remainingExpiry =
          (accessPayload.exp || 0) - Math.floor(Date.now() / 1000);
        if (remainingExpiry > 0) {
          await this.redis.set(
            `blacklisted_access_token:${accessPayload.jti}`,
            '1',
            'EX',
            remainingExpiry,
          );
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_err) {
        console.warn(
          'Attempted to sign out with invalid access token (for blacklisting).',
        );
      }
    }

    // Clear the refresh token cookie from the client
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Match the options used when setting the cookie
      sameSite: 'strict',
    });

    res.status(HttpStatus.NO_CONTENT).send(); // 204 No Content for successful logout
  }

  @Get('me')
  @UseGuards(AuthGuard) // Protect this endpoint with your authentication guard
  me(@GetUser() user: User) {
    // Use a custom decorator to get the user from the request
    return user;
  }

  @Get('refresh-token')
  async refresh(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies['refresh_token'] as string;

    try {
      const payload: RefreshTokenPayload = await this.jwtService.verifyAsync(
        refreshToken,
        { secret: this.config.get('JWT_SECRET') },
      );

      const user = await this.userService.findUserByID(payload.sub);
      if (!user) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .send({ error: 'Invalid refreshToken' });
      }

      const newAccessToken = this.authService.generateAccessToken({
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
        const refreshToken = this.authService.generateRefreshToken(newPayload);
        await this.redis.set(
          `refresh_token:${newPayload.jti}`,
          user.id as string,
          'EX',
          REFRESH_TOKEN_TTL,
        );

        res.cookie('refresh_token', refreshToken, {
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
          maxAge: REFRESH_TOKEN_TTL * 1000,
        });
      }

      // payload.exp
      return res.json({ accessToken: newAccessToken });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
