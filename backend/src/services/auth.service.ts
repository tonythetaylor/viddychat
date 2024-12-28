import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { createJWT } from '../utils/jwt.utils';

export const registerUser = async (email: string, password: string, username: string) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error('Email is already registered');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: { email, password: hashedPassword, username },
  });
};

export const loginUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  return createJWT(user.id);
};

export const getUserProfile = async (userId: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, username: true, createdAt: true },
  });
  if (!user) {
    throw new Error('User not found');
  }
  return user;
};