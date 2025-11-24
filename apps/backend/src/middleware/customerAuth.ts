import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'; // Use the same secret as in customerAuthService

// Extend the Request object to include customer property
declare global {
  namespace Express {
    interface Request {
      customer?: { id: string };
    }
  }
}

export const authenticateCustomer = (req: Request, res: Response, next: NextFunction) => {
  // Get token from header
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  const token = authHeader.split(' ')[1]; // Expects "Bearer TOKEN"
  if (!token) {
    return res.status(401).json({ message: 'Token not found' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { customerId: string };
    req.customer = { id: decoded.customerId };
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};
