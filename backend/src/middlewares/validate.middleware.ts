import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          status: 'validation_error',
          errors: error.errors.map((err) => ({
            field: err.path.slice(1).join('.'), // Remove "body", "query", etc. from path if desired
            message: err.message,
          })),
        });
      }
      return next(error);
    }
  };
};
