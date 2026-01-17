import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateToken = (payload: { userId: string; companyId: string; role: string; functions: string[] }) => {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
};

export const generateRefreshToken = (userId: string) => {
  // In a real scenario, store this in DB to allow revocation
  return jwt.sign({ userId, type: 'refresh' }, env.JWT_SECRET, { expiresIn: env.REFRESH_EXPIRES_IN });
};