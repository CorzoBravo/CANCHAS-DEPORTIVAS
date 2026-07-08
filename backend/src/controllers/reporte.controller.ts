import { Request, Response, NextFunction } from 'express';
import { ReporteService } from '../services/reporte.service';

const reporteService = new ReporteService();

export class ReporteController {
  async getReservas(req: Request, res: Response, next: NextFunction) {
    try {
      const { desde, hasta } = req.query;

      if (!desde || !hasta) {
        return res.status(400).json({
          status: 'error',
          message: 'Debe especificar los parámetros "desde" y "hasta" en formato YYYY-MM-DD.',
        });
      }

      const report = await reporteService.getReservasReport(desde as string, hasta as string);
      res.status(200).json({
        status: 'success',
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  async getIngresos(req: Request, res: Response, next: NextFunction) {
    try {
      const { desde, hasta } = req.query;

      if (!desde || !hasta) {
        return res.status(400).json({
          status: 'error',
          message: 'Debe especificar los parámetros "desde" y "hasta" en formato YYYY-MM-DD.',
        });
      }

      const report = await reporteService.getIngresosReport(desde as string, hasta as string);
      res.status(200).json({
        status: 'success',
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCanchasMasUsadas(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await reporteService.getCanchasMasUsadas();
      res.status(200).json({
        status: 'success',
        data: { ranking: report },
      });
    } catch (error) {
      next(error);
    }
  }
}
