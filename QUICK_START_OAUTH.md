# Quick Start: Testing OAuth

## 1. Set Up Environment Variables

### Backend (`apps/backend/.env`)
```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
AUTH_URL=http://localhost:3001
AUTH_SECRET=generate_a_random_32_char_string
FRONTEND_URL=http://localhost:3000
DATABASE_URL=your_database_url
PORT=3001
```

### Frontend (`apps/frontend/.env.local`)
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

## 2. Set Up Database

```bash
cd apps/backend
npx prisma generate
npx prisma migrate dev --name add_user_model
```

## 3. Start Servers

**Terminal 1 - Backend:**
```bash
cd apps/backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd apps/frontend
npm run dev
```

## 4. Test OAuth

1. Open browser: `http://localhost:3000`
2. Click "🔐 Test OAuth Login"
3. Click "Sign in with Google"
4. Authenticate with Google
5. You should be redirected to `/dashboard` with your user info

## 5. Verify It Works

- ✅ Dashboard shows your user information
- ✅ "Check Auth Status" button works
- ✅ "Logout" button works
- ✅ After logout, you're redirected to login

## Troubleshooting

- **Missing env vars?** Check backend console for warnings
- **CORS errors?** Verify `FRONTEND_URL` matches your frontend URL
- **Redirect URI mismatch?** Check Google Console settings match exactly: `http://localhost:3001/auth/google/callback`
- **Database errors?** Run Prisma migrations

See `OAUTH_TESTING_GUIDE.md` for detailed troubleshooting.

