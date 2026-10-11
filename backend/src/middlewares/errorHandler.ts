import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('[Error]', err);

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  if (err.code === 11000 || (err.name === 'MongoServerError' && err.code === 11000)) {
    const keyPattern = err.keyPattern || {};
    if (keyPattern.email || keyPattern.emailHash) {
      res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
      return;
    }
    if (keyPattern.phone || keyPattern.phoneHash) {
      res.status(409).json({
        success: false,
        message: 'An account with this phone number already exists.',
      });
      return;
    }
    res.status(409).json({
      success: false,
      message: 'A duplicate record already exists.',
    });
    return;
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
}
