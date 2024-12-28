import { UserPayload } from '../utils/jwt.utils'; // Adjust the path to your actual `UserPayload` location

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload; // Extend the Request interface to include `user`
    }
  }
}