process.env.TZ = 'UTC'; // Ensure Node.js process operates in UTC

import express, { Express, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as LocalStrategy } from 'passport-local';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import cors from 'cors';
import apiRouter from './routes/api';
import { authenticateStaff } from './services/staffService';
// Type declarations are automatically included from src/types/express.d.ts

dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'AUTH_URL', 'AUTH_SECRET'];
const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.warn(
    `Warning: Missing environment variables: ${missingEnvVars.join(', ')}. OAuth may not work correctly.`
  );
}

// Initialize
const app: Express = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// Session setup
app.use(
  session({
    secret: process.env.AUTH_SECRET || 'supersecret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      httpOnly: true, // Prevent XSS attacks
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    },
  })
);

// Passport setup
app.use(passport.initialize());
app.use(passport.session());

// Google OAuth setup
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.AUTH_URL}/auth/google/callback`,
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: any,
        done: (error: any, user?: any) => void
      ) => {
        try {
          if (!profile.id) {
            return done(new Error('Google profile ID is missing'), null);
          }

          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error('Email is required but not provided by Google'), null);
          }

          const user = await prisma.user.upsert({
            where: { googleId: profile.id },
            update: {
              email,
              name: profile.displayName || undefined,
              updatedAt: new Date(),
            },
            create: {
              googleId: profile.id,
              email,
              name: profile.displayName || undefined,
              role: 'CASHIER', // default for new users
            },
          });
          // Attach a 'type' property to distinguish Google users
          (user as any).type = 'google';
          return done(null, user);
        } catch (err) {
          console.error('Error in Google OAuth strategy:', err);
          return done(err, null);
        }
      }
    )
  );
} else {
  console.warn('Google OAuth credentials not configured. OAuth will not work.');
}

// Local Strategy for Staff Login
passport.use(new LocalStrategy(
  async (username: string, password: string, done: (error: any, user?: any, options?: { message: string }) => void) => {
    try {
      const staff = await authenticateStaff(username, password);
      if (!staff) {
        return done(null, false, { message: 'Incorrect username or password.' });
      }
      // Attach a 'type' property to distinguish local staff
      (staff as any).type = 'local';
      return done(null, staff);
    } catch (err) {
      console.error('Error in Local Strategy:', err);
      return done(err);
    }
  }
));

// Serialize user into the session
passport.serializeUser((user: any, done: (err: any, userObject?: any) => void) => {
  if (user.type === 'google') {
    done(null, { id: user.id, type: 'google' });
  } else if (user.type === 'local') {
    done(null, { staff_id: user.staff_id, type: 'local' });
  } else {
    done(new Error('Unknown user type'), null);
  }
});

// Deserialize user from the session
passport.deserializeUser(
  async (userObject: { id?: number; staff_id?: number; type: 'google' | 'local' }, done: (err: any, user?: any) => void) => {
    try {
      let user: any = null;
      if (userObject.type === 'google' && userObject.id) {
        const googleUser = await prisma.user.findUnique({ where: { id: userObject.id } });
        if (googleUser) {
          user = { ...googleUser, type: 'google' } as any;
        }
      } else if (userObject.type === 'local' && userObject.staff_id) {
        const localStaff = await prisma.staff.findUnique({ where: { staff_id: userObject.staff_id } });
        if (localStaff) {
          // Merge staff properties into a common Express.User structure
          user = { 
            staff_id: localStaff.staff_id,
            username: localStaff.username,
            role: localStaff.role,
            createdAt: localStaff.createdAt,
            updatedAt: localStaff.updatedAt,
            password_hash: localStaff.password_hash,
            type: 'local'
          } as any;
        }
      }

      if (!user) {
        return done(new Error('User not found during deserialization'), null);
      }
      done(null, user);
    } catch (err) {
      console.error('Error deserializing user:', err);
      done(err, null);
    }
  }
);

// --- AUTH MIDDLEWARE ---
// Authentication middleware is now in ./middleware/auth.ts

// --- AUTH ROUTES ---

// Google OAuth routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get(
  '/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=auth_failed`,
  }),
  (_req: Request, res: Response) => {
    // Successful authentication
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`);
  }
);

// Local Staff Login Route (POST for username/password)
// This route is handled by the /api/staff/login route defined in api.ts
// The actual Passport.js authentication for this is implicitly handled by the local strategy
// when the /api/staff/login endpoint is hit.

// Logout endpoint
app.post('/api/logout', (req: Request, res: Response, next: NextFunction) => {
  req.logout((err?: Error) => {
    if (err) {
      return next(err);
    }
    if (req.session) {
      req.session.destroy((destroyErr?: Error) => {
        if (destroyErr) {
          return next(destroyErr);
        }
        res.clearCookie('connect.sid');
        res.status(200).json({ message: 'Logged out successfully' });
      });
    } else {
      res.status(200).json({ message: 'Logged out successfully' });
    }
  });
});

// Check authentication status (handled by /api/user route via apiRouter)
// This explicit route is no longer needed here as apiRouter handles /api/user

// --- OTHER API ROUTES ---

app.use('/api', apiRouter);

// Example order creation endpoint (unchanged from yours)

// --- HEALTH ROUTE ---
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (_req, res) => {
  res.send('Hello from the backend!');
});

app.listen(port, () => {
  console.log(`Server running in timezone: ${new Date().toString()}`); // Log server timezone
  console.log(`Server running at http://localhost:${port}`);
});
