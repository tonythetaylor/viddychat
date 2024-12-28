import dotenv from 'dotenv';

dotenv.config();

export type Environment = 'development' | 'testing' | 'production';

export const ENV: Environment = (process.env.NODE_ENV as Environment) || 'production';

export const origins: Record<Environment, string[]> = {
  development: process.env.DEV_ORIGINS?.split(',') || ['http://localhost:3000'],
  testing: process.env.TEST_ORIGINS?.split(',') || [],
  production: process.env.PROD_ORIGINS?.split(',') || [],
};

export const allowedOrigins = origins[ENV] || [];