import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';

const prisma = new PrismaClient();

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        companyId: string | null; // Nullable for Super Admin
        role: 'SUPER_ADMIN' | 'ADMIN' | 'FUNCIONARIO';
        functions: string[];
      };
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido ou inválido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as any;
    req.user = decoded;

    // SaaS Logic: If user belongs to a company, check if company is active
    if (req.user?.companyId) {
      const company = await prisma.company.findUnique({
        where: { id: req.user.companyId }
      });

      if (!company || !company.active) {
        return res.status(403).json({ 
          error: 'Acesso bloqueado. Entre em contato com o suporte do SaaS.' 
        });
      }
    }

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token expirado ou inválido' });
  }
};

export const requireRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role !== role) {
      return res.status(403).json({ error: 'Acesso não autorizado.' });
    }
    next();
  };
};

export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Acesso restrito ao Super Admin' });
  }
  next();
};

export const requireCompanyAdmin = (req: Request, res: Response, next: NextFunction) => {
    // Super Admin also passes this check generally, or restrict strictly
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Acesso restrito a administradores' });
    }
    next();
};

export const requireFunction = (requiredFunction: 'BALCAO' | 'BANCADA') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    
    // Admins and Super Admins typically have bypass, or we assume they have all functions.
    // However, to be strict, we check roles first.
    if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
        return next();
    }

    if (user?.functions && user.functions.includes(requiredFunction)) {
        return next();
    }

    return res.status(403).json({ error: `Função operacional '${requiredFunction}' necessária para esta ação.` });
  };
};