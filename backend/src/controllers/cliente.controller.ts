import { Request, Response, NextFunction } from 'express';
import { ClienteService } from '../services/cliente.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

const clienteService = new ClienteService();

export class ClienteController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const client = await clienteService.register(req.body);
      res.status(201).json({
        status: 'success',
        data: { client },
      });
    } catch (error: any) {
      res.status(400).json({
        status: 'error',
        message: error.message,
      });
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const data = await clienteService.login(email, password);
      res.status(200).json({
        status: 'success',
        data,
      });
    } catch (error: any) {
      res.status(401).json({
        status: 'error',
        message: error.message,
      });
    }
  }

  async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const client = await clienteService.getClientById(userId);
      res.status(200).json({
        status: 'success',
        data: { client },
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const loggedUser = req.user!;

      // Enforce ownership: only admin or the client itself can query details
      if (loggedUser.rol !== 'admin' && loggedUser.id !== id) {
        return res.status(403).json({
          status: 'error',
          message: 'No tienes autorización para ver los detalles de este cliente.',
        });
      }

      const client = await clienteService.getClientById(id);
      res.status(200).json({
        status: 'success',
        data: { client },
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
      const loggedUser = req.user!;

      // Only allow admins or the client himself to update the data
      if (loggedUser.rol !== 'admin' && loggedUser.id !== id) {
        return res.status(403).json({
          status: 'error',
          message: 'No tienes permisos para modificar este cliente.',
        });
      }

      // Security check: only admins can change user roles
      if (req.body.rol && loggedUser.rol !== 'admin') {
        return res.status(403).json({
          status: 'error',
          message: 'No tienes autorización para cambiar el rol de un usuario.',
        });
      }

      const client = await clienteService.updateClient(id, req.body);
      res.status(200).json({
        status: 'success',
        data: { client },
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
      await clienteService.deleteClient(id);
      res.status(200).json({
        status: 'success',
        message: 'Cliente eliminado correctamente.',
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
      const search = req.query.search as string;
      const clients = await clienteService.getAllClients(search);
      res.status(200).json({
        status: 'success',
        data: { clients },
      });
    } catch (error) {
      next(error);
    }
  }
}
