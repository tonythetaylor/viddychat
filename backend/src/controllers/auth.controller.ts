import { Request, Response } from 'express';
import { registerUser, loginUser, getUserProfile } from '../services/auth.service';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, username } = req.body;
    const user = await registerUser(email, password, username);
    res.status(201).json({ message: 'User registered successfully', user });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const token = await loginUser(email, password);
    res.status(200).json({ message: 'Login successful', token });
  } catch (error: any) {
    res.status(401).json({ message: error.message });
  }
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
  
      const userId = req.user.id; // Safely access `user.id`
      const user = await getUserProfile(userId);
      res.status(200).json({ user });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };