import { Response, NextFunction } from 'express';
import { ReservaService } from '../services/reserva.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

const reservaService = new ReservaService();

export class ReservaController {
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const loggedUser = req.user!;
      const { clienteId, canchaId, fecha, horaInicio, horaFin } = req.body;

      // Clients can only create bookings for themselves. Admins can create for any client.
      if (loggedUser.rol !== 'admin' && loggedUser.id !== clienteId) {
        return res.status(403).json({
          status: 'error',
          message: 'No puedes crear una reserva a nombre de otro cliente.',
        });
      }

      const reservation = await reservaService.createReserva({
        clienteId,
        canchaId,
        fecha,
        horaInicio,
        horaFin,
      });

      res.status(201).json({
        status: 'success',
        data: { reservation },
      });
    } catch (error: any) {
      res.status(400).json({
        status: 'error',
        message: error.message,
      });
    }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const loggedUser = req.user!;
      const reservation = await reservaService.getReservaById(id);

      // Only allow admin or the owner client to view details
      if (loggedUser.rol !== 'admin' && loggedUser.id !== reservation.clienteId) {
        return res.status(403).json({
          status: 'error',
          message: 'No tienes autorización para ver esta reserva.',
        });
      }

      res.status(200).json({
        status: 'success',
        data: { reservation },
      });
    } catch (error: any) {
      res.status(404).json({
        status: 'error',
        message: error.message,
      });
    }
  }

  async cancel(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const loggedUser = req.user!;

      const reservation = await reservaService.cancelReserva(id, loggedUser);

      res.status(200).json({
        status: 'success',
        message: 'Reserva cancelada correctamente.',
        data: { reservation },
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
      const loggedUser = req.user!;
      const { canchaId, fecha } = req.query;
      let clienteId = req.query.clienteId as string;

      // If user is not admin, they are forced to view only their own bookings
      if (loggedUser.rol !== 'admin') {
        clienteId = loggedUser.id;
      }

      const reservations = await reservaService.listReservas({
        clienteId,
        canchaId: canchaId as string,
        fecha: fecha as string,
      });

      res.status(200).json({
        status: 'success',
        data: { reservations },
      });
    } catch (error) {
      next(error);
    }
  }
}
