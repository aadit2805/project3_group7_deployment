import { Request, Response, NextFunction } from 'express';

// Middleware to check if user is authenticated
export const isAuthenticated = (req: Request, res: Response, next: NextFunction): void => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    next();
    return;
  }
  res.status(401).json({ message: 'Not authenticated' });
};

// Middleware to check if user is a manager
export const isManager = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  if (!req.user || req.user.role !== 'MANAGER') {
    res.status(403).json({ message: 'Access denied. Manager role required.' });
    return;
  }

  next();
};
