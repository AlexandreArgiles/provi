import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { hashPassword, comparePassword } from '../utils/security';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Schemas
const createUserSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  role: z.enum(['ADMIN', 'FUNCIONARIO', 'TECHNICIAN']),
  functions: z.array(z.string()).optional(),
  companyId: z.string().optional()
});

const updateUserSchema = z.object({
  name: z.string().min(3).optional(),
  email: z.string().email().optional(),
  role: z.enum(['ADMIN', 'FUNCIONARIO', 'TECHNICIAN']).optional(),
  functions: z.array(z.string()).optional(),
});

const updateProfileSchema = z.object({
  name: z.string().min(3).optional(),
  email: z.string().email().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).optional()
});

export const userController = {
  // LISTAR USUÁRIOS
  list: async (req: Request, res: Response) => {
    const { role, companyId } = req.user!;
    let whereClause: any = {
      deletedAt: null // Não listar deletados
    };

    if (role === 'ADMIN') {
      whereClause.companyId = companyId;
    } else if (role === 'SUPER_ADMIN') {
      const queryCompanyId = req.query.companyId as string;
      if (queryCompanyId) whereClause.companyId = queryCompanyId;
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: { id: true, name: true, email: true, role: true, functions: true, active: true, createdAt: true, companyId: true }
    });
    
    return res.json(users);
  },

  // CRIAR USUÁRIO
  create: async (req: Request, res: Response) => {
    try {
      const requester = req.user!;
      const data = createUserSchema.parse(req.body);
      let targetCompanyId: string | null = null;
      let userFunctions = data.functions || [];

      if (requester.role === 'ADMIN') {
        if (data.role === 'ADMIN') return res.status(403).json({ error: 'Admins não podem criar outros Admins.' });
        targetCompanyId = requester.companyId;
      } else if (requester.role === 'SUPER_ADMIN') {
        if (!data.companyId) return res.status(400).json({ error: 'CompanyID obrigatório para Super Admin.' });
        targetCompanyId = data.companyId;
      } else {
        return res.status(403).json({ error: 'Sem permissão.' });
      }

      const exists = await prisma.user.findUnique({ where: { email: data.email } });
      if (exists) return res.status(400).json({ error: 'E-mail já cadastrado.' });

      const hashedPassword = await hashPassword(data.password);

      const user = await prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashedPassword,
          role: data.role,
          // @ts-ignore
          functions: userFunctions,
          companyId: targetCompanyId,
          active: true
        }
      });

      return res.status(201).json({ success: true, user: { id: user.id, email: user.email } });
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues });
      return res.status(500).json({ error: 'Erro ao criar usuário.' });
    }
  },

  // EDITAR USUÁRIO (Gestão)
  update: async (req: Request, res: Response) => {
    const { id } = req.params;
    const requester = req.user!;
    
    try {
      const targetUser = await prisma.user.findUnique({ where: { id } });
      if (!targetUser) return res.status(404).json({ error: 'Usuário não encontrado.' });

      // Verificação de Escopo
      if (requester.role === 'ADMIN') {
        if (targetUser.companyId !== requester.companyId) return res.status(403).json({ error: 'Usuário pertence a outra empresa.' });
        if (targetUser.role === 'ADMIN' && targetUser.id !== requester.userId) return res.status(403).json({ error: 'Você não pode editar outros Admins.' });
      }
      
      const data = updateUserSchema.parse(req.body);

      // Prevenção de Escalonamento de Privilégio
      if (requester.role === 'ADMIN' && data.role === 'ADMIN') {
        return res.status(403).json({ error: 'Você não pode promover usuários a Admin.' });
      }

      const updated = await prisma.user.update({
        where: { id },
        data: {
            name: data.name,
            email: data.email,
            role: data.role,
            // @ts-ignore
            functions: data.functions
        }
      });

      return res.json({ success: true, user: updated });
    } catch (error) {
       return res.status(400).json({ error: 'Erro na atualização.' });
    }
  },

  // SOFT DELETE
  delete: async (req: Request, res: Response) => {
    const { id } = req.params;
    const requester = req.user!;

    try {
        const targetUser = await prisma.user.findUnique({ where: { id } });
        if (!targetUser) return res.status(404).json({ error: 'Usuário não encontrado.' });

        if (requester.role === 'ADMIN') {
            if (targetUser.companyId !== requester.companyId) return res.status(403).json({ error: 'Acesso negado.' });
            if (targetUser.role === 'ADMIN') return res.status(403).json({ error: 'Não é possível excluir um Admin.' });
        }

        // Soft Delete
        await prisma.user.update({
            where: { id },
            data: { 
                active: false,
                deletedAt: new Date()
            }
        });

        return res.json({ success: true, message: 'Usuário removido com sucesso.' });
    } catch (error) {
        return res.status(500).json({ error: 'Erro ao excluir usuário.' });
    }
  },

  // AUTO EDIÇÃO (Meu Perfil)
  updateProfile: async (req: Request, res: Response) => {
    const requester = req.user!;
    try {
        const data = updateProfileSchema.parse(req.body);
        const user = await prisma.user.findUnique({ where: { id: requester.userId } });
        
        if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

        let updateData: any = {};
        if (data.name) updateData.name = data.name;
        if (data.email) updateData.email = data.email;

        // Troca de Senha
        if (data.newPassword) {
            if (!data.currentPassword) {
                return res.status(400).json({ error: 'Senha atual é obrigatória para definir nova senha.' });
            }
            const isValid = await comparePassword(data.currentPassword, user.password);
            if (!isValid) return res.status(401).json({ error: 'Senha atual incorreta.' });

            updateData.password = await hashPassword(data.newPassword);
            updateData.mustChangePassword = false;
        }

        const updated = await prisma.user.update({
            where: { id: requester.userId },
            data: updateData
        });

        return res.json({ success: true, message: 'Perfil atualizado.' });
    } catch (error) {
        return res.status(400).json({ error: 'Erro ao atualizar perfil.' });
    }
  },

  // RESETAR SENHA (Admin reseta senha do funcionário)
  resetPassword: async (req: Request, res: Response) => {
      const { id } = req.params;
      const requester = req.user!;

      try {
        const targetUser = await prisma.user.findUnique({ where: { id } });
        if (!targetUser) return res.status(404).json({ error: 'Usuário não encontrado.' });

        // Validação de Escopo
        if (requester.role === 'ADMIN') {
             if (targetUser.companyId !== requester.companyId) return res.status(403).json({ error: 'Acesso negado.' });
             if (targetUser.role === 'ADMIN' && targetUser.id !== requester.userId) {
                 return res.status(403).json({ error: 'Você não pode resetar senha de outro Admin.' });
             }
        }

        // Gerar senha temporária
        const tempPassword = crypto.randomBytes(4).toString('hex'); // 8 chars
        const hashedPassword = await hashPassword(tempPassword);

        await prisma.user.update({
            where: { id },
            data: {
                password: hashedPassword,
                mustChangePassword: true
            }
        });

        return res.json({ success: true, tempPassword, message: 'Senha resetada. Informe a senha temporária ao usuário.' });

      } catch (error) {
          return res.status(500).json({ error: 'Erro ao resetar senha.' });
      }
  },

  // ATIVAR / DESATIVAR
  toggleStatus: async (req: Request, res: Response) => {
    const { id } = req.params;
    const requester = req.user!;
    
    const userToUpdate = await prisma.user.findUnique({ where: { id } });
    if (!userToUpdate) return res.status(404).json({ error: 'Usuário não encontrado.' });

    if (requester.role === 'ADMIN' && userToUpdate.companyId !== requester.companyId) {
        return res.status(403).json({ error: 'Acesso negado.' });
    }
    if (userToUpdate.id === requester.userId) {
        return res.status(400).json({ error: 'Não pode desativar a si mesmo.' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { active: !userToUpdate.active }
    });

    return res.json({ success: true, active: updated.active });
  }
};