import { User as PrismaUser } from '@prisma/client';

declare global {
  namespace Express {
    interface User extends PrismaUser {
      id: number;
      googleId: string | null;
      email: string | null;
      name: string | null;
      role: string | null;
      createdAt: Date;
      updatedAt: Date;
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
