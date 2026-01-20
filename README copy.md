# Central Server Frontend - Super Admin Portal

**IMPORTANT: This is a Super Admin only interface for managing the Central ANPR Server.**

## Overview

The Central Server Frontend is a React-based web application designed exclusively for super administrators to manage and monitor the Central ANPR (Automatic Number Plate Recognition) system. This portal provides system-wide visibility and control over all client organizations and their vehicle detection data.

## Key Features

### 🔐 Authentication
- **Super Admin Access Only**: Requires a super admin organization token
- Token-based authentication using `X-API-Token` header
- Persistent session via localStorage
- Secure token input with password masking

### 📊 Super Admin Dashboard
- **System Health Monitoring**: Real-time CPU, RAM, and uptime metrics
- **System-Wide Statistics**:
  - Total Organizations (active/inactive)
  - Total Detections across all organizations
  - Success Rate of ANPR processing
  - Total Unique Cameras
- **Detection Status Breakdown**:
  - Pending detections
  - Processing detections
  - Successful detections
  - Failed detections
- **Visual Progress Bar**: Shows distribution of detection statuses

### 🏢 Organization Management
- List all organizations in the system
- Create new organizations
- Edit organization details
- View organization statistics (cameras, detections)
- **API Token Management**:
  - View organization API tokens (show/hide)
  - Copy tokens to clipboard
  - Regenerate tokens
- Delete organizations
- Search organizations by name or code

### 🚗 ANPR Detections
- **View ALL detections** across all organizations (super admin privilege)
- **Advanced Filtering**:
  - By camera ID
  - By processing status (pending/processing/success/failed)
  - Search by numberplate text
- **Comprehensive Detection Data**:
  - Detection ID and client detection ID
  - Numberplate text with color (white/yellow/black)
  - Vehicle side (front/rear/side)
  - Vehicle class
  - Camera information
  - Organization ID
  - Processing status with color-coded badges
  - Error messages and retry counts
  - Timestamps
- Pagination for large datasets

## Technology Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: TanStack Query (React Query)
- **HTTP Client**: Axios
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Date Formatting**: date-fns

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Central Server backend running on port 8001
- Super admin organization token

### Installation

```bash
# Install dependencies
npm install
```

### Configuration

The frontend connects to the Central Server backend. Update the API URL if needed:

**Environment Variable** (optional):
```bash
# Create .env file
VITE_API_URL=http://localhost:8001
```

Default connection is `http://localhost:8001` with proxy configured in `vite.config.ts`.

### Running the Application

```bash
# Development mode (port 3001)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Obtaining a Super Admin Token

You need a super admin organization token to access this portal. You can create one via:

#### Option 1: Direct API Call
```bash
curl -X POST http://localhost:8001/api/v1/organizations/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Super Admin",
    "code": "SUPERADMIN",
    "is_active": true
  }'
```

The response will contain the `token` field.

#### Option 2: Database Query
```sql
-- Mark an organization as super admin
UPDATE organizations
SET is_super_admin = true
WHERE id = 1;

-- Get the token
SELECT token FROM organizations WHERE is_super_admin = true;
```

### Login

1. Open `http://localhost:3001`
2. You'll see the **Super Admin Portal** login screen
3. Enter your super admin token
4. Click "Login as Super Admin"

The token is saved in localStorage and will persist across browser sessions.

## Application Structure

```
central-server-frontend/
├── src/
│   ├── components/
│   │   ├── AuthWrapper.tsx          # Authentication guard
│   │   ├── ConfirmModal.tsx         # Confirmation dialogs
│   │   ├── Layout.tsx               # Main layout with sidebar
│   │   ├── LocationModal.tsx        # (Not used - legacy)
│   │   ├── OrganizationModal.tsx    # Org create/edit modal
│   │   └── OrganizationViewModal.tsx # Org detail view with token
│   │
│   ├── pages/
│   │   ├── Dashboard.tsx            # Super admin dashboard
│   │   ├── Detections.tsx           # ANPR detections list
│   │   └── Organizations.tsx        # Organization management
│   │
│   ├── services/
│   │   └── api.ts                   # API client with endpoints
│   │
│   ├── types/
│   │   └── index.ts                 # TypeScript type definitions
│   │
│   ├── App.tsx                      # Root component with routing
│   └── main.tsx                     # Application entry point
│
├── public/                          # Static assets
├── vite.config.ts                   # Vite configuration
├── tailwind.config.js               # Tailwind CSS configuration
└── tsconfig.json                    # TypeScript configuration
```

## API Endpoints Used

### Public (No Auth Required)
- `GET /health` - System health check

### Authenticated (Super Admin Token Required)

#### Organizations
- `GET /api/v1/organizations/` - List all organizations
- `GET /api/v1/organizations/{id}` - Get organization details
- `GET /api/v1/organizations/search?q=...` - Search organizations
- `POST /api/v1/organizations/` - Create new organization
- `PUT /api/v1/organizations/{id}` - Update organization
- `DELETE /api/v1/organizations/{id}` - Delete organization
- `POST /api/v1/organizations/{id}/regenerate-token` - Regenerate API token

#### ANPR Detections
- `GET /api/v1/anpr/detections` - List all detections (all orgs)
  - Query params: `skip`, `limit`, `status_filter`, `camera_id`
- `GET /api/v1/anpr/detection/{id}` - Get detection by ID
- `GET /api/v1/anpr/detection/client/{client_id}` - Get by client ID

#### Admin (Super Admin Only)
- `GET /api/v1/admin/organizations` - All organizations with statistics
- `GET /api/v1/admin/organizations/{id}/stats` - Specific org statistics
- `GET /api/v1/admin/stats` - System-wide statistics

## Features Breakdown

### Dashboard
- ✅ Real-time system health monitoring
- ✅ Organization count (total and active)
- ✅ Detection statistics across all organizations
- ✅ Success rate calculation
- ✅ Detection status breakdown with visual progress
- ✅ System information panel

### Organizations
- ✅ CRUD operations for organizations
- ✅ Search functionality
- ✅ API token display and management
- ✅ Token regeneration with confirmation
- ✅ Copy token to clipboard
- ✅ Organization statistics (cameras, detections)

### Detections
- ✅ System-wide detection viewing (all organizations)
- ✅ Filter by camera ID
- ✅ Filter by processing status
- ✅ Search by numberplate text
- ✅ Comprehensive detection details
- ✅ Color-coded status badges
- ✅ Error message display
- ✅ Pagination support

## Security Notes

🔐 **Super Admin Access Only**
- This portal is designed exclusively for super administrators
- Regular organization tokens may have limited access
- Always use HTTPS in production
- Keep super admin tokens secure
- Rotate tokens periodically

🚫 **Not Included**
- User authentication system (uses token-based auth)
- Role-based access control UI (super admin only)
- Multi-factor authentication
- Token expiry handling (backend responsibility)

## Development

### Project Structure Decisions

- **No Camera/Location Management**: Cameras and locations are managed by local ANPR systems, not the central server
- **Super Admin Focus**: All features assume super admin access with system-wide visibility
- **Token-Based Auth**: Simple token authentication without user accounts
- **No Organization Filter in Detections**: Super admin sees all detections by default

### Adding New Features

1. Add TypeScript types in `src/types/index.ts`
2. Add API endpoints in `src/services/api.ts`
3. Create/update page components in `src/pages/`
4. Update routing in `src/App.tsx`
5. Add navigation links in `src/components/Layout.tsx` if needed

## Troubleshooting

### Login Issues
- Ensure you have a super admin organization token
- Check that the backend is running on port 8001
- Verify the token in the database: `SELECT * FROM organizations WHERE is_super_admin = true;`
- Clear localStorage if stuck: `localStorage.clear()` in browser console

### API Connection Issues
- Check backend is running: `curl http://localhost:8001/health`
- Verify CORS is configured in backend
- Check browser network tab for errors
- Ensure proxy is working in vite.config.ts

### No Detections Showing
- Ensure super admin token is valid
- Check that detections exist in the database
- Verify backend API endpoint is working
- Check browser console for errors

## Production Deployment

### Build
```bash
npm run build
# Output in dist/ directory
```

### Environment Variables
```bash
VITE_API_URL=https://your-central-server-api.com
```

### Serve
Serve the `dist/` directory using any static file server:
- Nginx
- Apache
- Netlify
- Vercel
- AWS S3 + CloudFront

### Important
- Use HTTPS in production
- Configure proper CORS on backend
- Set appropriate token storage security
- Consider adding logout functionality
- Implement token expiry handling

## Future Enhancements

- [ ] Logout button in UI
- [ ] Token expiry handling
- [ ] Refresh token mechanism
- [ ] User profile page showing current organization info
- [ ] Better error handling for auth failures
- [ ] Real-time updates using WebSockets
- [ ] Export detections to CSV/Excel
- [ ] Advanced analytics and reporting
- [ ] Audit logs for super admin actions

## Support

For issues or questions:
1. Check the backend logs
2. Check browser console for errors
3. Verify super admin token is valid
4. Contact system administrator

## License

[Your License Here]

---

**Remember: This is a super admin portal. Handle with care and keep access restricted.**
