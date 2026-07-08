import { Router } from 'express';
import { CanchaController } from '../controllers/cancha.controller';
import { authenticateJWT, requireRole } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { z } from 'zod';

const router = Router();
const controller = new CanchaController();

// Validation Schemas
const createCanchaSchema = z.object({
  body: z.object({
    nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    tipo: z.string().min(2, 'El tipo es requerido (ej: Futbol 5)'),
    precioHora: z.number().positive('El precio por hora debe ser un número positivo'),
    habilitada: z.boolean().optional(),
  }),
});

const updateCanchaSchema = z.object({
  body: z.object({
    nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
    tipo: z.string().min(2, 'El tipo es requerido').optional(),
    precioHora: z.number().positive('El precio por hora debe ser positivo').optional(),
    habilitada: z.boolean().optional(),
  }),
});

// Routes
router.get('/', controller.list);
router.get('/:id', controller.getById);
router.get('/:id/disponibilidad', controller.getAvailability);

// Admin-only write routes
router.post('/', authenticateJWT, requireRole(['admin']), validate(createCanchaSchema), controller.create);
router.put('/:id', authenticateJWT, requireRole(['admin']), validate(updateCanchaSchema), controller.update);
router.delete('/:id', authenticateJWT, requireRole(['admin']), controller.delete);

export default router;
