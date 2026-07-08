import { Router } from 'express';
import { PagoController } from '../controllers/pago.controller';
import { authenticateJWT, requireRole } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { z } from 'zod';

const router = Router();
const controller = new PagoController();

// Validation Schemas
const processPaymentSchema = z.object({
  body: z.object({
    reservaId: z.string().uuid('ID de reserva inválido (UUID requerido)'),
    numeroTarjeta: z.string().regex(/^\d{16}$/, 'El número de tarjeta debe tener 16 dígitos (sin espacios)'),
    nombreTitular: z.string().min(3, 'El nombre del titular debe tener al menos 3 caracteres'),
    cvv: z.string().regex(/^\d{3,4}$/, 'El CVV debe tener 3 o 4 dígitos'),
    expiracion: z.string().regex(/^\d{2}\/\d{2}$/, 'La expiración debe estar en formato MM/AA'),
  }),
});

// All routes require authentication
router.use(authenticateJWT);

router.post('/', validate(processPaymentSchema), controller.process);
router.get('/reserva/:reservaId', controller.getByReserva);

// Admin-only global history
router.get('/', requireRole(['admin']), controller.list);

export default router;
