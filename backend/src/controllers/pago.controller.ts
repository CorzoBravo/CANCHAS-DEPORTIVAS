import { Response, NextFunction } from 'express';
import { PagoService } from '../services/pago.service';
import { ReservaService } from '../services/reserva.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

const pagoService = new PagoService();
const reservaService = new ReservaService();

export class PagoController {
  async process(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const loggedUser = req.user!;
      const { reservaId, numeroTarjeta, nombreTitular, cvv, expiracion } = req.body;

      // Check reservation existence and ownership
      const reservation = await reservaService.getReservaById(reservaId);
      if (loggedUser.rol !== 'admin' && loggedUser.id !== reservation.clienteId) {
        return res.status(403).json({
          status: 'error',
          message: 'No puedes realizar el pago de una reserva que no te pertenece.',
        });
      }

      const payment = await pagoService.processPayment({
        reservaId,
        numeroTarjeta,
        nombreTitular,
        cvv,
        expiracion,
      });

      res.status(201).json({
        status: 'success',
        message: 'Pago procesado y reserva confirmada exitosamente.',
        data: { payment },
      });
    } catch (error: any) {
      res.status(400).json({
        status: 'error',
        message: error.message,
      });
    }
  }

  async getByReserva(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { reservaId } = req.params;
      const loggedUser = req.user!;

      // Validate ownership
      const reservation = await reservaService.getReservaById(reservaId);
      if (loggedUser.rol !== 'admin' && loggedUser.id !== reservation.clienteId) {
        return res.status(403).json({
          status: 'error',
          message: 'No puedes consultar pagos de una reserva que no te pertenece.',
        });
      }

      const payments = await pagoService.getPaymentsByReserva(reservaId);
      res.status(200).json({
        status: 'success',
        data: { payments },
      });
    } catch (error: any) {
      res.status(400).json({
        status: 'error',
        message: error.message,
      });
    }
  }

  async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const payments = await pagoService.listAllPayments();
      res.status(200).json({
        status: 'success',
        data: { payments },
      });
    } catch (error) {
      next(error);
    }
  }
}
