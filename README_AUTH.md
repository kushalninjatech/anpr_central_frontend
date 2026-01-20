# Central Server Frontend - Authentication Guide

## API Authentication

The Central Server frontend requires an API token for most operations. The backend uses `X-API-Token` header for authentication.

### Setting Up Authentication

#### Option 1: Using Browser Console (Development)

1. Start the frontend: `npm run dev`
2. Open browser console (F12)
3. Set the API token:

```javascript
// Import the setApiToken function (you may need to expose it globally)
// Or directly set in localStorage for persistence
localStorage.setItem('apiToken', 'your-super-admin-token-here');
```

4. Reload the page

#### Option 2: Manual API Token Setup

The current frontend implementation needs to be updated to include:
- A login page or token input field
- Token storage in localStorage
- Automatic token injection in API calls

### For Development

You can get a super admin token by:

1. Creating a super admin organization in the backend
2. Using the organization's API token

Example using backend CLI or API:

```bash
# Get token from database or create organization via API
curl -X POST http://localhost:8001/api/v1/organizations/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Super Admin Org",
    "code": "SUPERADMIN",
    "is_active": true
  }'
```

The response will include the `token` field.

### Required for:

- **Dashboard** - Requires super admin token (uses `/api/v1/admin/stats`)
- **Detections** - Requires any valid org token (uses `/api/v1/anpr/detections`)
- **Organizations** - No auth required for listing (but create/update/delete needs auth)

### Notes

- Without authentication, detection and admin endpoints will return 401 Unauthorized
- The frontend currently doesn't have a login UI - this needs to be implemented
- For now, use browser console or modify code to hardcode token for testing

## TODO: Add Authentication UI

Recommended additions:
1. Login page with token input
2. Store token in localStorage
3. Auto-inject token in all API calls via axios interceptor
4. Show "not authenticated" message when token is missing
5. Logout functionality to clear token
