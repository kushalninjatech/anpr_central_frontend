# Central Server Frontend - Changelog

## Updated to Match Central Server APIs (December 25, 2024)

### Overview
Updated the central-server-frontend to align with the actual central-server backend APIs instead of the local ANPR backend.

### Key Changes

#### 1. **API Service Layer** (`src/services/api.ts`)
- Changed base URL from `localhost:8010` to `localhost:8001` (central-server port)
- Updated Organizations API:
  - Added `regenerateToken()` endpoint
- Updated ANPR Detection API:
  - Endpoints now point to `/api/v1/anpr/*`
  - Methods: `getAll()`, `getById()`, `getByClientId()`, `searchByPlate()`
- Added Admin API (Super Admin only):
  - `getAllOrganizations()` - Get all orgs with stats
  - `getOrganizationStats(orgId)` - Get specific org stats
  - `getSystemStats()` - Get system-wide statistics

#### 2. **TypeScript Types** (`src/types/index.ts`)
- **Organization**: Added `token` field for API authentication
- **Detection**: Completely updated to match ANPR schema:
  - Uses `detection_id` instead of `id`
  - Added fields: `status`, `numberplate_text`, `numberplate_color`, `vehicle_side`, `llm_confidence`
  - Removed fields: `location_id`, `plate_confidence`, etc.
- Added new types:
  - `ProcessingStatus`: 'pending' | 'processing' | 'success' | 'failed'
  - `NumberplateColor`: 'white' | 'yellow' | 'black' | 'unknown'
  - `VehicleSide`: 'front' | 'rear' | 'side' | 'unknown'
  - `OrganizationStats`: For admin view
- **DashboardStats**: Updated to system stats schema with detection status breakdown

#### 3. **Organizations Page** (`src/pages/Organizations.tsx`)
- No structural changes needed (already compatible)
- Organization view modal updated to show API token

#### 4. **Organization View Modal** (`src/components/OrganizationViewModal.tsx`)
- Added API token display section with:
  - Show/Hide toggle for token visibility
  - Copy to clipboard button
  - Regenerate token button with confirmation
- Token displayed in secure format with dots when hidden

#### 5. **Detections Page** (`src/pages/Detections.tsx`)
- Complete rewrite to match ANPR detection schema:
  - Removed location-based filtering
  - Added camera ID filter
  - Added processing status filter
  - Updated table columns to show:
    - Detection ID (with client_detection_id)
    - Numberplate text with color and side
    - Vehicle class
    - Camera name/ID
    - Organization ID
    - Processing status with badges
    - Error messages and retry count
    - Timestamp
- Added status badge system with colors:
  - Pending: Yellow
  - Processing: Blue
  - Success: Green
  - Failed: Red

#### 6. **Dashboard Page** (`src/pages/Dashboard.tsx`)
- Complete rewrite to use Admin API:
  - System health monitoring (CPU, RAM, uptime)
  - Main stats cards:
    - Total Organizations (with active count)
    - Total Detections
    - Success Rate percentage
    - Total Cameras
  - Detection Status Breakdown:
    - Pending, Processing, Success, Failed counts
    - Visual progress bar showing distribution
  - System information panel

#### 7. **Vite Configuration** (`vite.config.ts`)
- Updated proxy configuration:
  - Server port: 3001
  - Proxy target: `http://localhost:8001` (central-server)
  - Proxied paths: `/api`, `/health`, `/uploads`

### API Endpoints Used

**Organizations:**
- GET `/api/v1/organizations/` - List all organizations
- GET `/api/v1/organizations/{id}` - Get organization details
- GET `/api/v1/organizations/search?q=...` - Search organizations
- POST `/api/v1/organizations/` - Create organization
- PUT `/api/v1/organizations/{id}` - Update organization
- DELETE `/api/v1/organizations/{id}` - Delete organization
- POST `/api/v1/organizations/{id}/regenerate-token` - Regenerate API token

**ANPR Detections:**
- GET `/api/v1/anpr/detections` - List detections (with filters)
- GET `/api/v1/anpr/detection/{id}` - Get detection by ID
- GET `/api/v1/anpr/detection/client/{client_id}` - Get by client detection ID

**Admin (Super Admin only):**
- GET `/api/v1/admin/organizations` - Get all orgs with stats
- GET `/api/v1/admin/organizations/{id}/stats` - Get org stats
- GET `/api/v1/admin/stats` - Get system-wide statistics

**Health:**
- GET `/health` - System health check

### Features

✅ Organization management with API token handling
✅ ANPR detection viewing with status tracking
✅ System-wide statistics dashboard
✅ Real-time health monitoring
✅ Processing status breakdown
✅ Camera and organization filtering
✅ Numberplate search
✅ Responsive design with Tailwind CSS

### Running the Application

```bash
# Install dependencies
npm install

# Run development server (port 3001)
npm run dev

# Build for production
npm run build
```

### Notes

- Requires central-server running on port 8001
- Dashboard uses Admin API (requires super admin token)
- Token management built into organization view
- Real-time updates with React Query
- All Location and Camera management removed (not part of central-server API)
