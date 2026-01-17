import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { hashPassword, generateToken } from '../utils/security';

const prisma = new PrismaClient();

const setupSchema = z.object({
  adminName: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6)
});

export const setupController = {
  /**
   * Instalação do SaaS.
   * Cria o SUPER_ADMIN (Dono do SaaS) que não pertence a nenhuma empresa.
   */
  install: async (req: Request, res: Response) => {
    try {
      const existingUsers = await prisma.user.count();
      
      if (existingUsers > 0) {
        return res.status(403).json({
          code: 'SETUP_LOCKED',
          error: 'O sistema já possui usuários. O setup só é permitido uma vez.',
        });
      }

      const data = setupSchema.parse(req.body);
      const hashedPassword = await hashPassword(data.password);

      // Create Super Admin (companyId is null)
      const user = await prisma.user.create({
        data: {
          name: data.adminName,
          email: data.email,
          password: hashedPassword,
          role: 'SUPER_ADMIN',
          companyId: null,
          // @ts-ignore
          functions: ['BALCAO', 'BANCADA']
        }
      });

      const token = generateToken({
        userId: user.id,
        companyId: "", // Empty for Super Admin
        role: 'SUPER_ADMIN',
        functions: ['BALCAO', 'BANCADA']
      });

      return res.status(201).json({
        success: true,
        message: 'SaaS Instalado com Sucesso. Bem-vindo, Super Admin.',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });

    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.issues });
      }
      return res.status(500).json({ error: 'Falha crítica na instalação.' });
    }
  }
};