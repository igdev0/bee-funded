import { Request } from 'express';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserEntity } from './entities/user.entity';

export const GetUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserEntity => {
    const request: Request = ctx.switchToHttp().getRequest();
    return request.user as UserEntity; // Assuming AuthGuard attaches the user to request.user
  },
);
