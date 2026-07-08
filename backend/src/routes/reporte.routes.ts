import { Router } from 'express';
import { ReporteController } from '../controllers/reporte.controller';
import { authenticateJWT, requireRole } from '../middlewares/auth.middleware';

const router = Router();
const controller = new ReporteController();

// All routes require authentication and admin role
router.use(authenticateJWT);
router.use(requireRole(['admin']));

router.get('/reservas', controller.getReservas);
router.get('/ingresos', controller.getIngresos);
router.get('/canchas-mas-usadas', controller.getCanchasMasUsadas);

export default router;
