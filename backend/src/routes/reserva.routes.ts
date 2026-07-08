import { Router } from 'express';
import { ReservaController } from '../controllers/reserva.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { z } from 'zod';

const router = Router();
const controller = new ReservaController();

// Validation Schemas
const createReservaSchema = z.object({
  body: z.object({
    clienteId: z.string().uuid('ID de cliente inválido (UUID requerido)'),
    canchaId: z.string().uuid('ID de cancha inválido (UUID requerido)'),
    fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe estar en formato YYYY-MM-DD'),
    horaInicio: z.string().regex(/^\d{2}:\d{2}$/, 'La hora de inicio debe estar en formato HH:MM (24h)'),
    horaFin: z.string().regex(/^\d{2}:\d{2}$/, 'La hora de fin debe estar en formato HH:MM (24h)'),
  }),
});

// All reservation endpoints require authentication
router.use(authenticateJWT);

router.post('/', validate(createReservaSchema), controller.create);
router.get('/', controller.list);
router.get('/:id', controller.getById);
router.delete('/:id', controller.cancel); // Cancel reservation endpoint

export default router;
