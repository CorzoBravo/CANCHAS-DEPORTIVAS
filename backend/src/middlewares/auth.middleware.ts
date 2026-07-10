import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET as string;

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    rol: string;
  };
}

export const authenticateJWT = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1]; // Expecting "Bearer <token>"

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({
          status: 'error',
          message: 'Token is invalid or expired',
        });
      }

      req.user = decoded as { id: string; email: string; rol: string };
      next();
    });
  } else {
    res.status(401).json({
      status: 'error',
      message: 'Authorization header is missing',
    });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
    }

    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({
        status: 'error',
        message: 'Forbidden: You do not have permission to access this resource',
      });
    }

    next();
  };
};
