import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { comparePassword, generateToken, generateRefreshToken, hashPassword } from '../utils/security';

const prisma = new PrismaClient();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

const changePasswordSchema = z.object({
  newPassword: z.string().min(6)
});

export const authController = {
  register: async (req: Request, res: Response) => {
      res.status(404).json({ error: "Registro público desativado. Contate o administrador." });
  },

  login: async (req: Request, res: Response) => {
    try {
      const { email, password } = loginSchema.parse(req.body);

      // Busca usuário, garantindo que não foi deletado
      const user = await prisma.user.findFirst({ 
        where: { 
          email,
          deletedAt: null 
        } 
      });
      
      if (!user || !user.active) {
        return res.status(401).json({ error: 'Credenciais inválidas ou acesso revogado.' });
      }

      // Se for usuário de empresa, verificar se empresa está ativa e NÃO deletada
      if (user.companyId) {
        const company = await prisma.company.findUnique({ where: { id: user.companyId }});
        if (!company || !company.active || company.deletedAt) {
             return res.status(403).json({ error: 'Acesso bloqueado. Empresa inativa ou removida.' });
        }
      }

      const isValid = await comparePassword(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      const token = generateToken({
        userId: user.id,
        companyId: user.companyId || '', 
        role: user.role,
        functions: (user as any).functions || []
      });
      
      const refreshToken = generateRefreshToken(user.id);

      return res.json({
        success: true,
        token,
        refreshToken,
        user: { 
            id: user.id, 
            name: user.name, 
            role: user.role,
            companyId: user.companyId,
            mustChangePassword: user.mustChangePassword
        }
      });

    } catch (error) {
      return res.status(400).json({ error: 'Dados inválidos' });
    }
  },

  changePassword: async (req: Request, res: Response) => {
    try {
      const { newPassword } = changePasswordSchema.parse(req.body);
      const userId = req.user!.userId;

      const hashedPassword = await hashPassword(newPassword);

      await prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          mustChangePassword: false
        }
      });

      return res.json({ success: true, message: 'Senha alterada com sucesso.' });

    } catch (error) {
      return res.status(400).json({ error: 'Erro ao alterar senha.' });
    }
  }
};