import { Request } from 'express';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type GetRefreshTokenType = string | undefined;

export const GetRefreshToken = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const req: Request = ctx.switchToHttp().getRequest();
    return req.cookies['refresh_token'] as GetRefreshTokenType;
  },
);

export type GetAccessTokenType = string | null;

export const GetAccessToken = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): GetAccessTokenType => {
    const req: Request = ctx.switchToHttp().getRequest();

    const authorization = req.headers.authorization ?? null;
    if (!authorization) {
      return null;
    }
    return authorization.replace('Bearer ', '');
  },
);
