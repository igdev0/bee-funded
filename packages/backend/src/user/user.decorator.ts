import { Request } from 'express';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from './entities/user.entity';

export const GetUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User => {
    const request: Request = ctx.switchToHttp().getRequest();
    return request.user as User; // Assuming AuthGuard attaches the user to request.user
  },
);
