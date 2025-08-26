import { UserEntity } from '../user/entities/user.entity';

// Declare the 'express-serve-static-core' module to augment its interfaces
declare module 'express-serve-static-core' {
  // Extend the Request interface
  interface Request {
    user?: UserEntity; // Make it optional if it might not always be present
  }
}

export interface PagedResponse<T> {
  data: T;
  total: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
