# Authentication Testing Guide

## ✅ Middleware Tests (Server-side)

All tests pass! The middleware correctly:

### 1. Protected Routes Redirect to Login
```bash
# Test home page
curl -I http://localhost:3000
# Expected: 307 redirect to /login?redirectedFrom=%2F

# Test /devis
curl -I http://localhost:3000/devis
# Expected: 307 redirect to /login?redirectedFrom=%2Fdevis

# Test /chantiers
curl -I http://localhost:3000/chantiers
# Expected: 307 redirect to /login?redirectedFrom=%2Fchantiers

# Test /agents
curl -I http://localhost:3000/agents
# Expected: 307 redirect to /login?redirectedFrom=%2Fagents
```

### 2. Login Page is Public
```bash
curl -I http://localhost:3000/login
# Expected: 200 OK (no redirect)
```

## 🧪 Browser Testing

### Test 1: Unauthenticated Access
1. Open a **new incognito/private window**
2. Navigate to: `http://localhost:3000`
3. ✅ **Expected**: Immediately redirected to `/login`
4. ✅ **Expected**: URL shows `?redirectedFrom=%2F` parameter

### Test 2: Try Accessing Protected Routes
1. In the same incognito window, try these URLs:
   - `http://localhost:3000/devis`
   - `http://localhost:3000/chantiers`
   - `http://localhost:3000/agents`
2. ✅ **Expected**: All redirect to `/login` with appropriate `redirectedFrom` parameter

### Test 3: Login and Redirect Back
1. On the login page, enter credentials:
   - Email: (your Supabase user email)
   - Password: (your Supabase user password)
2. Click "Se connecter"
3. ✅ **Expected**: Redirected to the original page you tried to access
4. ✅ **Expected**: Dashboard now loads successfully

### Test 4: Authenticated Users Cannot Access Login
1. While logged in, try to access: `http://localhost:3000/login`
2. ✅ **Expected**: Immediately redirected to `/` (home page)

### Test 5: Logout
1. Click "Se déconnecter" button in the sidebar (bottom)
2. ✅ **Expected**: Redirected to `/login`
3. ✅ **Expected**: Cannot access dashboard pages anymore

### Test 6: Session Persistence
1. Login successfully
2. Refresh the page (F5 or Cmd+R)
3. ✅ **Expected**: Stay logged in, page reloads normally
4. Close and reopen the browser
5. Navigate to `http://localhost:3000`
6. ✅ **Expected**: Still logged in (session persisted in cookies)

## 🔍 Troubleshooting

### Issue: Not redirecting to login
**Symptoms**: Can access dashboard without logging in

**Solutions**:
1. Check browser console for errors
2. Verify environment variables are set:
   ```bash
   # In dashboard/.env.local
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
3. Clear browser cache and cookies
4. Restart the dev server: `npm run dev`

### Issue: "Invalid login credentials" error
**Symptoms**: Login form shows error message

**Solutions**:
1. Verify user exists in Supabase:
   - Go to Supabase Dashboard → Authentication → Users
   - Check if your email is listed
2. If user doesn't exist, create one:
   - Click "Add user" → "Create new user"
   - Enter email and password
   - Check "Auto Confirm User"
3. Try the password you set (not the one from your memory 😄)

### Issue: Redirect loop
**Symptoms**: Page keeps redirecting between `/` and `/login`

**Solutions**:
1. Clear all browser cookies for `localhost:3000`
2. Check middleware.ts for syntax errors
3. Restart dev server
4. Try incognito mode

### Issue: Session not persisting
**Symptoms**: Get logged out on page refresh

**Solutions**:
1. Check browser allows cookies for localhost
2. Verify Supabase project settings allow cookie-based auth
3. Check browser console for cookie-related errors

## 📝 Notes

- The middleware uses `getSession()` which checks cookies locally (fast)
- The `redirectedFrom` parameter ensures users return to their intended page
- Sessions persist via HTTP-only cookies set by Supabase
- Logout clears all auth cookies and invalidates the session

## ✨ Expected User Flow

```
1. User visits /devis (unauthenticated)
   ↓
2. Middleware redirects to /login?redirectedFrom=%2Fdevis
   ↓
3. User enters credentials and clicks "Se connecter"
   ↓
4. Supabase authenticates and sets session cookies
   ↓
5. Login page redirects to /devis (from redirectedFrom param)
   ↓
6. Middleware allows access (session exists)
   ↓
7. User sees /devis page ✅
```
