import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpStatus,
  Inject,
  InternalServerErrorException,
  Logger,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UnprocessableEntityException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { generateNonce, SiweMessage } from 'siwe';
import { Request, Response } from 'express';
import { UserService } from '../user/user.service';
import { User } from '../user/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { CacheManagerStore } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { AuthGuard } from './auth.guard';
import { GetUser } from '../user/user.decorator';
import { GetAccessToken, GetRefreshToken } from './auth.decorator';
import SignInDto from './dto/signin.dto';

@Controller('auth')
export class AuthController {
  logger = new Logger('AuthController');
  secure = false;

  constructor(
    private readonly userService: UserService,
    @Inject(CACHE_MANAGER) private readonly cache: CacheManagerStore,
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {
    this.secure = this.config.get('auth.secure') as boolean;
  }

  @Get('nonce')
  async getNonce(@Res() res: Response) {
    const nonce = generateNonce();
    await this.cache.set(nonce, 'valid');
    res.status(HttpStatus.OK).send(nonce);
  }

  @Post('signin')
  async signIn(@Body() body: SignInDto, @Res() res: Response) {
    const siweMessage = new SiweMessage(body.message);
    // 1. Verify the nonce
    // ===================
    const nonceStatus = (await this.cache.get(siweMessage.nonce)) as string;
    let user: User | null = null;

    if (!nonceStatus) {
      throw new UnprocessableEntityException(new Error('Invalid nonce'));
    }
    try {
      user = await this.userService.findOneByWalletAddress(siweMessage.address);
    } catch (err) {
      this.logger.error(err);
      throw new InternalServerErrorException(err, {
        description: 'Failed querying the user by wallet address',
      });
    }

    // 2. Verify user signature
    // ========================
    try {
      const siweResponse = await siweMessage.verify({
        nonce: siweMessage.nonce,
        signature: body.signature,
      });

      if (siweResponse.error) {
        return { error: siweResponse.error };
      }
    } catch (err) {
      this.logger.error(err);
      throw new BadRequestException(err, {
        description: 'Failed to verify user',
      });
    }

    // 3. Creating the new user if it doesn't exist
    // ============================================
    if (!user) {
      try {
        user = await this.userService.create({
          wallet_address: siweMessage.address,
        });
      } catch (err) {
        this.logger.error(err);
        throw new InternalServerErrorException(err, {
          description: 'Server failed to create user',
        });
      }
    }

    // 4. Sign the access token and generate the refresh token
    // =======================================================
    const { accessTokenTTL, refreshTokenTTL, accessToken, refreshToken } =
      await this.authService.signIn(user);
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: this.secure,
      sameSite: 'strict',
      maxAge: refreshTokenTTL * 1000,
    });
    res.status(HttpStatus.OK).json({ accessToken, ttl: accessTokenTTL, user });
  }

  @Post('signout')
  async signOut(@Req() req: Request, @Res() res: Response) {
    const refreshToken = AuthService.extractRefreshTokenFromHeader(req);
    const accessToken = AuthService.extractAccessTokenFromHeader(req);
    try {
      await this.authService.signOut(refreshToken, accessToken);
    } catch (err) {
      this.logger.error(err);
      throw new ForbiddenException(err, {
        description: 'Failed to sign out',
      });
    }
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: this.secure,
      sameSite: 'strict',
    });
    res.status(HttpStatus.OK).json({ success: true });
  }

  @Get('me')
  @UseGuards(AuthGuard)
  getMe(@GetUser() user: User) {
    return user;
  }

  @Get('refresh')
  async refresh(
    @GetRefreshToken() refreshToken: string | undefined,
    @GetAccessToken() accessToken: string | null,
    @Res() res: Response,
  ) {
    if (!refreshToken) {
      throw new UnauthorizedException('Invalid refreshToken');
    }
    const { newAccessToken, newRefreshToken } = await this.authService.refresh(
      refreshToken,
      accessToken,
    );
    if (newRefreshToken) {
      res.cookie('refresh_token', newRefreshToken, {
        httpOnly: true,
        secure: this.secure,
        sameSite: 'strict',
        maxAge: (this.config.get('auth.refreshTokenTTL') as number) * 1000,
      });
    }

    res.status(HttpStatus.OK).json({
      accessToken: newAccessToken,
      ttl: this.config.get('auth.accessTokenTTL') as number,
    });
  }
}
