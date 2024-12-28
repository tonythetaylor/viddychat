import jwt from 'jsonwebtoken';

export interface UserPayload {
  id: number;
}

const SECRET = process.env.JWT_SECRET || 'your_secret_key';

export const createJWT = (userId: number) => {
  return jwt.sign({ id: userId }, SECRET, { expiresIn: '1h' });
};

export const verifyJWT = (token: string): UserPayload => {
  return jwt.verify(token, SECRET) as UserPayload;
};