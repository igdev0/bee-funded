import { User } from '../user/entities/user.entity';

// Declare the 'express-serve-static-core' module to augment its interfaces
declare module 'express-serve-static-core' {
  // Extend the Request interface
  interface Request {
    user?: User; // Make it optional if it might not always be present
  }
}

// Optionally, if you use @nestjs/common Request, you might need to extend that too
// if you prefer to use it directly rather than 'express' Request
// import { Request as NestRequest } from '@nestjs/common';
// declare module '@nestjs/common' {
//   interface Request {
//     user?: AccessTokenPayload;
//   }
// }