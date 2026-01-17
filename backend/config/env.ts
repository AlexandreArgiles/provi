import dotenv from 'dotenv';
dotenv.config();

export const env = {
  PORT: process.env.PORT || 3000,
  JWT_SECRET: process.env.JWT_SECRET || 'providencia-secret-key-change-in-prod',
  JWT_EXPIRES_IN: '8h',
  REFRESH_EXPIRES_IN: '7d',
  NODE_ENV: process.env.NODE_ENV || 'development'
};