import { User } from '../user/entities/user.entity';

// Declare the 'express-serve-static-core' module to augment its interfaces
declare module 'express-serve-static-core' {
  // Extend the Request interface
  interface Request {
    user?: User; // Make it optional if it might not always be present
  }
}
