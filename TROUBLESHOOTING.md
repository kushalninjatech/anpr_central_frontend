# Troubleshooting Guide - Central Server Frontend

## White Screen / Blank Page Issues

### Detections Page Showing White Screen

**Possible Causes:**

1. **No Super Admin Token Set**
   - The detections API requires authentication
   - Check: Open browser console (F12) and look for 401 Unauthorized errors
   - Fix: Make sure you've logged in with a super admin token

2. **Backend Not Running**
   - The frontend expects backend on port 8001
   - Check: `curl http://localhost:8001/health`
   - Fix: Start the central-server backend

3. **CORS Issues**
   - Browser blocks requests due to CORS
   - Check: Browser console for CORS errors
   - Fix: Ensure backend has CORS properly configured

4. **Invalid Token**
   - Token may not be a super admin token
   - Check: Browser console for 403 Forbidden errors
   - Fix: Use a token from an organization with `is_super_admin = true`

### Step-by-Step Debug Process

#### 1. Check Browser Console
```
F12 → Console tab
Look for errors in red
```

Common errors:
- `401 Unauthorized` - No token or invalid token
- `403 Forbidden` - Not a super admin token
- `Network Error` - Backend not running
- `CORS Error` - CORS not configured

#### 2. Verify Token is Set
```javascript
// In browser console
localStorage.getItem('superAdminToken')
// Should return your token string
```

If null or undefined:
- You're not logged in
- Login screen should appear automatically

#### 3. Test Backend Connection
```bash
# Test health endpoint
curl http://localhost:8001/health

# Expected response:
{
  "status": "healthy",
  "version": "1.0.0",
  ...
}
```

#### 4. Test Detections API Manually
```bash
# Replace YOUR_TOKEN with your actual super admin token
curl -H "X-API-Token: YOUR_TOKEN" \
  http://localhost:8001/api/v1/anpr/detections?limit=10

# Expected: JSON array of detections (can be empty [])
# Error 401: Invalid token
# Error 403: Not a super admin token
```

#### 5. Check Network Tab
```
F12 → Network tab
Refresh page
Look for failed requests (red)
Click on failed request to see details
```

### Common Solutions

#### Solution 1: Clear and Re-login
```javascript
// In browser console
localStorage.clear()
location.reload()
// Then login again with super admin token
```

#### Solution 2: Verify Super Admin Status
```sql
-- In PostgreSQL
SELECT id, name, code, is_super_admin, token
FROM organizations
WHERE is_super_admin = true;

-- If no results, create/update one:
UPDATE organizations
SET is_super_admin = true
WHERE id = 1;
```

#### Solution 3: Check Backend Logs
```bash
# In central-server directory
tail -f logs/app.log

# Look for:
# - Authentication errors
# - Database connection errors
# - API endpoint errors
```

## Dashboard Not Loading

**Symptoms:** Dashboard shows loading spinner forever or error

**Cause:** Admin API endpoint not accessible

**Fix:**
1. Verify you're using super admin token
2. Check backend has admin router included:
   ```python
   # In central-server/app/main.py
   app.include_router(
       admin.router,
       prefix=f"{settings.API_V1_PREFIX}/admin",
       tags=["Admin"]
   )
   ```

3. Test admin endpoint:
   ```bash
   curl -H "X-API-Token: YOUR_TOKEN" \
     http://localhost:8001/api/v1/admin/stats
   ```

## Organizations Page Issues

**Symptom:** Can't create organizations

**Possible Causes:**
- Missing fields in form
- Database constraint violations
- Backend validation errors

**Debug:**
1. Check browser console for API errors
2. Check backend logs for validation errors
3. Verify database schema is up to date (run migrations)

## General Debugging Tips

### Enable Verbose Logging

In `src/services/api.ts`, add request/response logging:

```typescript
api.interceptors.request.use(request => {
  console.log('API Request:', request);
  return request;
});

api.interceptors.response.use(
  response => {
    console.log('API Response:', response);
    return response;
  },
  error => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);
```

### Check API Token is Being Sent

```javascript
// In browser console
// Check default headers
import api from './services/api';
console.log(api.defaults.headers.common);
// Should show: { 'X-API-Token': 'your-token-here' }
```

### Verify Backend Port

Default is 8001. If your backend runs on a different port:

1. Update `.env`:
   ```bash
   VITE_API_URL=http://localhost:YOUR_PORT
   ```

2. Update `vite.config.ts`:
   ```typescript
   proxy: {
     '/api': {
       target: 'http://localhost:YOUR_PORT',
       changeOrigin: true,
     }
   }
   ```

3. Restart dev server:
   ```bash
   npm run dev
   ```

## Error Messages Reference

| Error | Meaning | Solution |
|-------|---------|----------|
| 401 Unauthorized | No token or invalid token | Login with valid super admin token |
| 403 Forbidden | Not super admin | Use super admin organization token |
| 404 Not Found | Endpoint doesn't exist | Check backend routes are registered |
| 500 Internal Server Error | Backend error | Check backend logs |
| Network Error | Can't reach backend | Start backend server |
| CORS Error | CORS not configured | Update backend CORS settings |

## Still Having Issues?

1. **Clear all data and start fresh:**
   ```javascript
   localStorage.clear()
   sessionStorage.clear()
   // Clear cache: Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac)
   ```

2. **Verify installations:**
   ```bash
   # Frontend
   cd central-server-frontend
   rm -rf node_modules package-lock.json
   npm install
   npm run dev

   # Backend
   cd central-server
   # Start backend
   ```

3. **Check versions:**
   - Node.js: v18 or higher
   - npm: v9 or higher
   - Backend: Python 3.10+

4. **Test in different browser:**
   - Try Chrome/Firefox/Safari
   - Incognito/Private mode

5. **Check backend health:**
   ```bash
   curl http://localhost:8001/health
   curl http://localhost:8001/docs  # API documentation
   ```

## Getting Help

If you're still stuck, gather this information:

1. Browser console errors (screenshot or copy text)
2. Network tab showing failed request details
3. Backend logs (last 50 lines)
4. Steps to reproduce the issue
5. What you've already tried

Then contact your system administrator or check the project's issue tracker.
