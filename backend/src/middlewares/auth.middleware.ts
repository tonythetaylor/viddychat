import { Request, Response, NextFunction } from 'express';
import { verifyJWT } from '../utils/jwt.utils';

export const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    res.status(401).json({ message: 'Access denied' });
    return;
  }

  try {
    const decoded = verifyJWT(token); // Decode the JWT
    req.user = decoded; // Attach the decoded user to `req.user`
    next(); // Call the next middleware
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};