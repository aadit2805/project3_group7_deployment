import { User as PrismaUser } from '@prisma/client';

declare global {
  namespace Express {
    interface User {
      role: string;
      createdAt: Date;
      updatedAt: Date;
      password_hash?: string; // Only for local staff

      // Google OAuth specific
      id?: number; // Prisma User ID
      googleId?: string | null;
      email?: string | null;
      name?: string | null;

      // Local Staff specific
      staff_id?: number; // Prisma Staff ID
      username?: string; // For local staff
    }
    interface Request {
      user?: User;
      isAuthenticated?(): boolean;
      logout(callback?: (err?: Error) => void): void;
      session?: {
        destroy(callback?: (err?: Error) => void): void;
        [key: string]: any;
      };
    }
  }
}

export {};
