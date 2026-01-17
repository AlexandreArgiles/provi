import { Router } from 'express';
import { authController } from './controllers/authController';
import { userController } from './controllers/userController';
import { setupController } from './controllers/setupController';
import { saasController } from './controllers/saasController';
import { authenticate, requireRole, requireSuperAdmin, requireCompanyAdmin } from './middleware/auth';

const router = Router();

// --- PÚBLICO ---
router.post('/setup', setupController.install);
router.post('/auth/login', authController.login);

// --- PROTEGIDO ---
router.use(authenticate);

// Autenticação & Perfil
router.post('/auth/change-password', authController.changePassword); // Troca obrigatória
router.put('/users/profile', userController.updateProfile);

// 1. Área do SUPER ADMIN (Gestão de SaaS)
router.get('/saas/companies', requireSuperAdmin, saasController.listCompanies);
router.post('/saas/companies', requireSuperAdmin, saasController.createCompany);
router.put('/saas/companies/:id', requireSuperAdmin, saasController.updateCompany); // Editar Empresa
router.delete('/saas/companies/:id', requireSuperAdmin, saasController.deleteCompany); // Excluir Empresa (Soft)
router.patch('/saas/companies/:id/toggle', requireSuperAdmin, saasController.toggleStatus);

// 2. Área da EMPRESA & USUÁRIOS
router.get('/users', requireCompanyAdmin, userController.list);
router.post('/users', requireCompanyAdmin, userController.create);
router.put('/users/:id', requireCompanyAdmin, userController.update); 
router.delete('/users/:id', requireCompanyAdmin, userController.delete); 
router.patch('/users/:id/toggle', requireCompanyAdmin, userController.toggleStatus); 
router.post('/users/:id/reset-password', requireCompanyAdmin, userController.resetPassword); 

// Placeholder para Ordens
router.get('/orders', (req, res) => {
  if(req.user?.role === 'SUPER_ADMIN') {
      return res.json({ message: "Super Admin não gerencia ordens diretamente." });
  }
  res.json({ message: `Acesso autorizado para empresa ${req.user?.companyId}` });
});

export { router };