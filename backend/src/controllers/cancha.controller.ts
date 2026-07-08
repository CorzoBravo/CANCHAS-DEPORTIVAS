import { Request, Response, NextFunction } from 'express';
import { CanchaService } from '../services/cancha.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

const canchaService = new CanchaService();

export class CanchaController {
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const court = await canchaService.createCancha(req.body);
      res.status(201).json({
        status: 'success',
        data: { court },
      });
    } catch (error: any) {
      res.status(400).json({
        status: 'error',
        message: error.message,
      });
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const court = await canchaService.getCanchaById(id);
      res.status(200).json({
        status: 'success',
        data: { court },
      });
    } catch (error: any) {
      res.status(404).json({
        status: 'error',
        message: error.message,
      });
    }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const court = await canchaService.updateCancha(id, req.body);
      res.status(200).json({
        status: 'success',
        data: { court },
      });
    } catch (error: any) {
      res.status(400).json({
        status: 'error',
        message: error.message,
      });
    }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await canchaService.deleteCancha(id);
      res.status(200).json({
        status: 'success',
        message: 'Cancha eliminada correctamente.',
      });
    } catch (error: any) {
      res.status(400).json({
        status: 'error',
        message: error.message,
      });
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      // If user is admin and requests all, show all. Otherwise, only show enabled courts.
      const onlyEnabled = req.query.all !== 'true';
      const courts = await canchaService.getAllCanchas(onlyEnabled);
      res.status(200).json({
        status: 'success',
        data: { courts },
      });
    } catch (error) {
      next(error);
    }
  }

  async getAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const fecha = req.query.fecha as string;

      if (!fecha) {
        return res.status(400).json({
          status: 'error',
          message: 'Debe especificar el parámetro de consulta "fecha" en formato YYYY-MM-DD.',
        });
      }

      const availability = await canchaService.getAvailability(id, fecha);
      res.status(200).json({
        status: 'success',
        data: availability,
      });
    } catch (error: any) {
      res.status(400).json({
        status: 'error',
        message: error.message,
      });
    }
  }
}
