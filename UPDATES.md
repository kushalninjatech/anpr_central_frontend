# Central Server Frontend - Latest Updates

## Changes Made (December 25, 2024)

### 1. Removed Camera and Location Pages ✅

**Files Modified:**
- `src/App.tsx` - Removed Cameras and Reports routes
- `src/components/Layout.tsx` - Removed Camera and Reports navigation links

**Reason:** The central-server backend doesn't have camera or location management endpoints. These are managed by the local ANPR systems. The central server only receives detection data.

### 2. Added Authentication System ✅

**New Files:**
- `src/components/AuthWrapper.tsx` - Authentication wrapper component with token input UI
- `README_AUTH.md` - Authentication guide

**Features:**
- Token-based authentication using `X-API-Token` header
- Token stored in localStorage for persistence
- Beautiful login UI with token input field
- Auto-injection of token in all API requests via `setApiToken()` function

**How to Use:**
1. Start the app: `npm run dev`
2. You'll see a login screen
3. Enter an organization API token (get from creating an organization)
4. Token is saved and used for all API calls

### 3. Fixed Detection Screen ✅

**Issues Fixed:**
- Backend returns array directly, not wrapped in `.data`
- Added proper type handling
- Shows camera details in the detection table

**Detection Page Features:**
- View all ANPR detections
- Filter by:
  - Organization
  - Camera ID
  - Processing status (pending/processing/success/failed)
  - Numberplate text search
- Displays:
  - Detection ID and client detection ID
  - Numberplate text with color and vehicle side
  - Vehicle class
  - Camera information
  - Organization
  - Processing status with color-coded badges
  - Error messages and retry counts
  - Timestamps

### Current App Structure

```
Central Server Frontend
├── Dashboard (Admin Stats)
│   ├── System Health (CPU, RAM, Uptime)
│   ├── Organizations Count
│   ├── Total Detections
│   ├── Success Rate
│   ├── Detection Status Breakdown
│   └── Total Cameras
│
├── Organizations
│   ├── List all organizations
│   ├── Create/Edit/Delete organizations
│   ├── View organization details
│   ├── Display API token (show/hide)
│   ├── Copy token to clipboard
│   └── Regenerate token
│
└── Detections (ANPR Results)
    ├── List all detections
    ├── Filter by org/camera/status
    ├── Search by numberplate
    ├── View processing status
    └── See camera details in table
```

### API Endpoints Used

#### Public (No Auth)
- `GET /health` - System health

#### Authenticated (Requires X-API-Token)

**Organizations:**
- `GET /api/v1/organizations/` - List organizations
- `GET /api/v1/organizations/{id}` - Get organization
- `GET /api/v1/organizations/search?q=...` - Search
- `POST /api/v1/organizations/` - Create organization
- `PUT /api/v1/organizations/{id}` - Update organization
- `DELETE /api/v1/organizations/{id}` - Delete organization
- `POST /api/v1/organizations/{id}/regenerate-token` - Regenerate token

**ANPR Detections (requires token):**
- `GET /api/v1/anpr/detections` - List detections
  - Query params: `skip`, `limit`, `status_filter`, `camera_id`, `organization_id`
- `GET /api/v1/anpr/detection/{id}` - Get by detection ID
- `GET /api/v1/anpr/detection/client/{client_id}` - Get by client ID

**Admin (requires super admin token):**
- `GET /api/v1/admin/organizations` - All orgs with stats
- `GET /api/v1/admin/organizations/{id}/stats` - Org stats
- `GET /api/v1/admin/stats` - System-wide statistics

### Getting Started

#### 1. Install Dependencies
```bash
npm install
```

#### 2. Start Development Server
```bash
npm run dev
```
Server runs on `http://localhost:3001`

#### 3. Get an API Token

**Option A: Create Organization via API**
```bash
curl -X POST http://localhost:8001/api/v1/organizations/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Organization",
    "code": "TEST01",
    "is_active": true
  }'
```

Response includes the `token` field - copy it!

**Option B: Use existing organization**
If you already have an organization, get its token from the database or regenerate it.

#### 4. Login
- Open `http://localhost:3001`
- Paste your API token in the login form
- Click "Authenticate"

### Token Permissions

**Regular Organization Token:**
- Can view its own detections
- Can list organizations (read-only)

**Super Admin Token:**
- Can view all detections across all organizations
- Can filter detections by any organization
- Can access Dashboard with system statistics
- Full CRUD on organizations

### Architecture

```
┌─────────────────────────────────────────┐
│   Central Server Frontend (Port 3001)   │
│                                          │
│  ┌──────────────┐    ┌────────────────┐ │
│  │ AuthWrapper  │───▶│  API Service   │ │
│  └──────────────┘    │ (axios + token)│ │
│                      └────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │ Pages: Dashboard | Orgs | Detections│ │
│  └────────────────────────────────────┘ │
└──────────────────┬───────────────────────┘
                   │ HTTP + X-API-Token header
                   ▼
┌─────────────────────────────────────────┐
│   Central Server Backend (Port 8001)    │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │ /api/v1/organizations              │ │
│  │ /api/v1/anpr                       │ │
│  │ /api/v1/admin (super admin only)  │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │ PostgreSQL Database                │ │
│  │  - Organizations                   │ │
│  │  - ANPR Detections                 │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Notes

- ✅ Authentication is now required and handled via UI
- ✅ No camera management (cameras are managed by local systems)
- ✅ No location management (not in central server scope)
- ✅ Detections show camera details in the table directly
- ✅ Token persists in localStorage across sessions
- ⚠️ Logout button not yet added to UI (can clear localStorage manually)
- ⚠️ No super admin creation UI (create via backend/database)

### Future Enhancements

1. Add logout button in Layout
2. Show current user's organization info
3. Add token expiry handling
4. Add refresh token mechanism
5. Better error messages for auth failures
6. Role-based UI (hide admin features for non-super-admin users)
