import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { hashPassword } from '../utils/security';

const prisma = new PrismaClient();

const createCompanySchema = z.object({
  name: z.string().min(3),
  adminName: z.string().min(3),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(6)
});

const updateCompanySchema = z.object({
  name: z.string().min(3)
});

export const saasController = {
  // List all companies (not deleted)
  listCompanies: async (req: Request, res: Response) => {
    try {
      const companies = await prisma.company.findMany({
        where: { deletedAt: null },
        include: {
          _count: {
            select: { users: { where: { deletedAt: null } } }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      const formatted = companies.map(c => ({
        id: c.id,
        name: c.name,
        active: c.active,
        createdAt: c.createdAt,
        userCount: c._count.users
      }));

      return res.json(formatted);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao listar empresas' });
    }
  },

  // Create
  createCompany: async (req: Request, res: Response) => {
    try {
      const data = createCompanySchema.parse(req.body);
      const existingUser = await prisma.user.findUnique({ where: { email: data.adminEmail } });
      if (existingUser) return res.status(400).json({ error: 'E-mail do admin já cadastrado.' });

      const result = await prisma.$transaction(async (tx) => {
        const company = await tx.company.create({
          data: { name: data.name, active: true }
        });
        const hashedPassword = await hashPassword(data.adminPassword);
        const admin = await tx.user.create({
          data: {
            name: data.adminName,
            email: data.adminEmail,
            password: hashedPassword,
            role: 'ADMIN',
            companyId: company.id,
            mustChangePassword: true // Force change on first login
          }
        });
        return { company, admin };
      });

      return res.status(201).json({
        success: true,
        company: result.company,
        admin: { id: result.admin.id, email: result.admin.email }
      });
    } catch (error: any) {
      return res.status(400).json({ error: error.errors || error.message });
    }
  },

  // Update
  updateCompany: async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const data = updateCompanySchema.parse(req.body);
      const updated = await prisma.company.update({
        where: { id },
        data: { name: data.name }
      });
      return res.json({ success: true, company: updated });
    } catch (error) {
      return res.status(400).json({ error: 'Erro ao atualizar empresa.' });
    }
  },

  // Soft Delete (Cascade to Users)
  deleteCompany: async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      await prisma.$transaction(async (tx) => {
        // Soft delete company
        await tx.company.update({
          where: { id },
          data: { active: false, deletedAt: new Date() }
        });
        
        // Soft delete all users of this company
        await tx.user.updateMany({
          where: { companyId: id },
          data: { active: false, deletedAt: new Date() }
        });
      });

      return res.json({ success: true, message: 'Empresa e usuários removidos com sucesso.' });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao excluir empresa.' });
    }
  },

  // Toggle Status
  toggleStatus: async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const company = await prisma.company.findUnique({ where: { id }});
        if(!company) return res.status(404).json({ error: 'Empresa não encontrada' });
        
        // Cannot toggle deleted company
        if(company.deletedAt) return res.status(400).json({ error: 'Empresa excluída.' });

        const updated = await prisma.company.update({
            where: { id },
            data: { active: !company.active }
        });

        return res.json({ success: true, active: updated.active });
    } catch (error) {
        return res.status(500).json({ error: 'Erro ao atualizar status' });
    }
  }
};