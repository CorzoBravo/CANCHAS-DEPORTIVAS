import { Router } from 'express';
import { ClienteController } from '../controllers/cliente.controller';
import { authenticateJWT, requireRole } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { z } from 'zod';

const router = Router();
const controller = new ClienteController();

// Validation Schemas
const registerSchema = z.object({
  body: z.object({
    nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    email: z.string().email('Formato de correo electrónico inválido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    telefono: z.string().optional(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Formato de correo electrónico inválido'),
    password: z.string().min(1, 'La contraseña es requerida'),
  }),
});

const updateSchema = z.object({
  body: z.object({
    nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
    email: z.string().email('Formato de correo electrónico inválido').optional(),
    telefono: z.string().optional(),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional(),
  }),
});

// Routes
router.post('/register', validate(registerSchema), controller.register);
router.post('/login', validate(loginSchema), controller.login);

router.get('/me', authenticateJWT, controller.getProfile);

// Admin-only listing of all clients
router.get('/', authenticateJWT, requireRole(['admin']), controller.list);

// Resource-specific routes
router.get('/:id', authenticateJWT, controller.getById);
router.put('/:id', authenticateJWT, validate(updateSchema), controller.update);
router.delete('/:id', authenticateJWT, requireRole(['admin']), controller.delete);

export default router;
