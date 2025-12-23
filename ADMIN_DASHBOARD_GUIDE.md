# Admin Dashboard - Complete Implementation Guide

## Overview

The Admin Dashboard is a comprehensive administrative interface for managing users, issues, and system analytics in the CIIS (Campus Infrastructure Intelligence System).

## Features

### 1. Dashboard Overview

- **Real-time Metrics**: Total users, issues, resolution rates
- **User Statistics**: Breakdown by role (admin, facility manager, staff, faculty, student)
- **Issue Statistics**: Status distribution, severity levels, average resolution time
- **Recent Activity**: Latest issues and new users
- **Top Contributors**: Users with most reported issues and votes

### 2. User Management

- **List All Users**: Paginated table with search and filters
- **Filter Options**:
  - By role (admin, facilityManager, staff, faculty, student)
  - By status (active/inactive)
  - Search by name or email
- **User Actions**:
  - Edit user details (name, role)
  - Toggle user status (active/inactive)
  - Delete user
  - View user statistics
- **Export**: Download users as CSV or JSON

### 3. Issue Management

- **List All Issues**: Card-based layout with comprehensive details
- **Advanced Filters**:
  - Status (open, in-progress, resolved, closed)
  - Severity level (low, medium, high, critical)
  - Category
  - Date range
  - Search by title/description
- **Issue Actions**:
  - Change status directly from list
  - View detailed information with images
  - Delete issue
- **Export**: Download filtered issues as CSV or JSON

### 4. Analytics Dashboard

- **Key Metrics**:
  - Total issues count
  - Resolved issues and resolution rate
  - Average resolution time
  - Critical issues count
- **Trend Charts**:
  - Issues reported over time (line chart)
  - Resolution trend over time (line chart)
- **Distribution Charts**:
  - Severity distribution (pie chart)
  - Top categories (bar chart)
  - Top buildings by issues (horizontal bar chart)
- **Date Range Filter**: 7 days, 30 days, 90 days, 1 year

## File Structure

```
frontend/src/
├── app/
│   ├── admin/
│   │   ├── layout.tsx          # Admin layout with sidebar
│   │   ├── page.tsx             # Dashboard overview
│   │   ├── users/
│   │   │   └── page.tsx         # User management
│   │   ├── issues/
│   │   │   └── page.tsx         # Issue management
│   │   └── analytics/
│   │       └── page.tsx         # Analytics dashboard
│   └── layout.tsx               # Root layout (updated with AuthProvider)
├── contexts/
│   └── AuthContext.tsx          # Authentication context
├── lib/
│   ├── api.ts                   # Base API client
│   └── adminService.ts          # Admin API service functions
├── services/
│   └── issueService.ts          # Issue management functions
└── components/
    └── landing/
        └── FloatingNav.tsx      # Updated with admin link
```

## API Integration

### Admin Service Functions

```typescript
// Dashboard
getDashboardOverview(): Promise<AdminDashboardOverview>

// Users
getAllUsers(params): Promise<PaginatedUsers>
getUserById(userId): Promise<User>
updateUser(userId, updates): Promise<User>
deleteUser(userId): Promise<void>
toggleUserStatus(userId): Promise<User>
getUserStats(userId): Promise<UserStats>
getUserActivity(userId, params): Promise<Activity[]>
bulkUpdateUsers(userIds, updates): Promise<UpdateResult>
exportUsers(format): Promise<Blob>

// Issues
getAllIssues(params): Promise<PaginatedIssues>
exportIssues(format, filters): Promise<Blob>

// Analytics
getSystemAnalytics(params): Promise<SystemAnalytics>
```

## Access Control

### Admin Route Protection

The admin dashboard is protected at two levels:

1. **Layout Level** (`/app/admin/layout.tsx`):

   - Checks if user is logged in
   - Verifies user has "admin" role
   - Redirects non-admin users to dashboard
   - Shows access denied for unauthorized access

2. **Backend Level** (existing):
   - All `/api/admin/*` endpoints protected with:
     - `authenticate` middleware (JWT token validation)
     - `authorize(UserRole.ADMIN)` middleware (role check)

### Navigation

- Admin link appears in FloatingNav only for users with `role === "admin"`
- Desktop and mobile menu both show "Admin" link for admins
- Link styled with purple accent to distinguish from regular navigation

## Authentication Context

Created `AuthContext` to manage authentication state:

```typescript
interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => void;
}
```

**Features**:

- Loads user data from localStorage on mount
- Provides user info throughout the app
- Handles logout with token cleanup
- Integrated with Next.js App Router

## UI Components & Styling

### Design System

**Color Palette**:

- Background: `gray-950` (dark)
- Cards: `gray-900` with `gray-800` borders
- Text: `white` (primary), `gray-400` (secondary)
- Accent: Purple (`purple-500`) and Pink (`pink-500`)
- Status Colors:
  - Open: Blue (`blue-400`)
  - In Progress: Yellow (`yellow-400`)
  - Resolved: Green (`green-400`)
  - Closed: Gray (`gray-300`)
  - Critical: Red (`red-400`)

**Components**:

- Gradient stat cards with icons
- Responsive data tables
- Modal dialogs for editing
- Loading spinners
- Toast notifications (react-hot-toast)
- Pagination controls
- Filter panels
- Export buttons

### Responsive Design

- Mobile-first approach
- Sidebar collapses on mobile with hamburger menu
- Tables become scrollable on small screens
- Grid layouts adapt: 3 columns → 2 columns → 1 column
- Touch-friendly buttons and controls

## Charts & Visualizations

Using **Recharts** library for analytics:

```typescript
// Line Charts: Trends over time
<LineChart data={analytics.issuesTrend}>
  <Line dataKey="count" stroke="#8b5cf6" />
</LineChart>

// Bar Charts: Category/building distributions
<BarChart data={categoryData}>
  <Bar dataKey="count" fill="#8b5cf6" />
</BarChart>

// Pie Charts: Severity distribution
<PieChart>
  <Pie data={severityData} />
</PieChart>
```

**Chart Features**:

- Dark theme matching app design
- Tooltips with formatted data
- Responsive containers
- Color-coded data series
- Grid lines for readability

## Usage Examples

### Accessing Admin Dashboard

1. **Login as Admin**:

   - Email/password or OAuth login
   - User must have `role: "admin"` in database

2. **Navigate to Admin**:

   - Click "Admin" link in navigation bar
   - Direct URL: `/admin`

3. **Dashboard Overview**:
   - View system-wide metrics
   - See recent activity
   - Check top contributors

### Managing Users

1. **View All Users**:

   - Navigate to `/admin/users`
   - See paginated user list

2. **Filter Users**:

   - Search by name/email
   - Filter by role (dropdown)
   - Filter by status (active/inactive)

3. **Edit User**:

   - Click edit icon on user row
   - Update display name or role
   - Save changes

4. **Toggle Status**:

   - Click ban icon to activate/deactivate user
   - Confirmation toast appears

5. **Delete User**:

   - Click delete icon
   - Confirm deletion in dialog
   - User removed from system

6. **Export Users**:
   - Click "Export CSV" or "Export JSON"
   - File downloads automatically

### Managing Issues

1. **View All Issues**:

   - Navigate to `/admin/issues`
   - See card-based issue list

2. **Filter Issues**:

   - Search by title/description
   - Filter by status, severity, category
   - Apply multiple filters

3. **Change Status**:

   - Use dropdown on each issue card
   - Status updates immediately

4. **View Details**:

   - Click "View Details" button
   - See full information and images
   - Modal with all issue data

5. **Delete Issue**:

   - Click delete button
   - Confirm deletion
   - Issue removed (email sent to reporter)

6. **Export Issues**:
   - Click export button
   - Current filters applied to export
   - Download as CSV or JSON

### Viewing Analytics

1. **Navigate to Analytics**:

   - Go to `/admin/analytics`
   - View comprehensive charts

2. **Change Date Range**:

   - Select from dropdown (7/30/90/365 days)
   - All charts update automatically

3. **Interpret Data**:
   - Issues trend: New reports over time
   - Resolution trend: Resolved issues over time
   - Severity distribution: Critical vs. low priority
   - Top categories: Most common issue types
   - Top buildings: Buildings with most issues

## Data Flow

### 1. User Authentication

```
Login → Token stored in localStorage → AuthContext loads user → Admin check
```

### 2. Dashboard Loading

```
Component mount → getDashboardOverview() → Fetch from /api/admin/dashboard → Display data
```

### 3. User Management

```
Load users → getAllUsers() → Apply filters → Display table → Actions (edit/delete/toggle)
```

### 4. Issue Management

```
Load issues → getAllIssues() → Apply filters → Display cards → Actions (status/delete)
```

### 5. Analytics

```
Select date range → getSystemAnalytics() → Process data → Render charts
```

## Error Handling

All admin pages implement comprehensive error handling:

```typescript
try {
  setLoading(true);
  const data = await adminService.someFunction();
  setData(data);
} catch (error: any) {
  toast.error(error.response?.data?.message || "Operation failed");
} finally {
  setLoading(false);
}
```

**Features**:

- Loading states with spinners
- Toast notifications for success/error
- Fallback error messages
- User-friendly error descriptions

## Performance Optimizations

1. **Pagination**:

   - Default 10 items per page
   - Backend handles pagination
   - Reduces data transfer and rendering time

2. **Lazy Loading**:

   - Charts only render when visible
   - Images lazy-loaded in modals

3. **Debounced Search**:

   - Search triggers after typing stops
   - Reduces API calls

4. **Efficient Filters**:
   - Filter changes reset to page 1
   - Combined filter parameters in single API call

## Security Considerations

1. **Frontend Protection**:

   - Layout checks user role before rendering
   - Redirects non-admins immediately
   - No admin data fetched for non-admins

2. **Backend Protection**:

   - All endpoints require authentication
   - Role-based authorization (admin only)
   - JWT token validation

3. **Data Sanitization**:
   - User inputs validated on backend
   - XSS protection in rendered content
   - SQL injection prevented by Firestore

## Testing the Admin Dashboard

### Prerequisites

1. Backend server running on `http://localhost:3001` (or configured URL)
2. User account with `role: "admin"` in database
3. Test data: users, issues, activities

### Test Scenarios

**1. Admin Access**:

- ✅ Admin user can access `/admin`
- ✅ Non-admin user redirected to `/dashboard`
- ✅ Unauthenticated user redirected to `/login`

**2. Dashboard Overview**:

- ✅ All stat cards display correct numbers
- ✅ Recent issues show latest 5 issues
- ✅ Recent users show latest 5 users
- ✅ Top contributors sorted by votes

**3. User Management**:

- ✅ Users table loads with pagination
- ✅ Search filters users by name/email
- ✅ Role filter works correctly
- ✅ Status filter shows active/inactive
- ✅ Edit modal updates user info
- ✅ Toggle status changes active flag
- ✅ Delete removes user
- ✅ Export downloads file

**4. Issue Management**:

- ✅ Issues display in card layout
- ✅ Status dropdown updates issue
- ✅ Filters work independently and combined
- ✅ Details modal shows all info
- ✅ Delete removes issue
- ✅ Export respects current filters

**5. Analytics**:

- ✅ Charts render with correct data
- ✅ Date range filter updates all charts
- ✅ Pie chart shows severity distribution
- ✅ Bar charts show top categories/buildings
- ✅ Line charts show trends over time

## Troubleshooting

### Common Issues

**1. "Access Denied" on admin pages**:

- **Cause**: User doesn't have admin role
- **Solution**: Update user role in database to "admin"

**2. API requests failing**:

- **Cause**: Backend not running or wrong URL
- **Solution**: Check `NEXT_PUBLIC_API_BASE_URL` environment variable

**3. Charts not rendering**:

- **Cause**: Missing or incorrect data structure
- **Solution**: Check analytics API response format

**4. User not found in AuthContext**:

- **Cause**: Token or user data not in localStorage
- **Solution**: Login again to store credentials

**5. Export downloads empty file**:

- **Cause**: No data matching filters
- **Solution**: Check filters, ensure data exists

## Future Enhancements

Potential improvements for the admin dashboard:

1. **Advanced Analytics**:

   - Predictive analytics with AI
   - Custom date range picker
   - More granular metrics

2. **Bulk Operations**:

   - Bulk user actions (already in backend)
   - Bulk issue status updates
   - Batch delete with confirmation

3. **Audit Logs**:

   - Track all admin actions
   - Display admin activity timeline
   - Export audit logs

4. **Real-time Updates**:

   - WebSocket integration for live data
   - Auto-refresh on data changes
   - Real-time notifications

5. **Custom Reports**:

   - Schedule reports
   - Email reports to admins
   - PDF export

6. **Role Management**:
   - Create custom roles
   - Permission granularity
   - Role-based feature access

## Deployment Notes

### Environment Variables

Ensure the following are set:

```env
# Frontend
NEXT_PUBLIC_API_BASE_URL=https://your-backend-url.com

# Backend
EMAIL_USER=ciis.innovex@gmail.com
EMAIL_PASSWORD=wcsn rjuu qqfb hice
FRONTEND_URL=https://ciis-innovex.vercel.app
```

### Build Process

1. **Install Dependencies**:

   ```bash
   cd frontend
   npm install
   ```

2. **Build for Production**:

   ```bash
   npm run build
   ```

3. **Start Production Server**:
   ```bash
   npm start
   ```

### Vercel Deployment

The frontend is configured for Vercel deployment:

1. Connect GitHub repository
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

## Support & Maintenance

### Updating Admin Features

To add a new admin feature:

1. **Backend**: Add new endpoint in `backend/src/modules/admin/`
2. **Service**: Add function in `frontend/src/lib/adminService.ts`
3. **Component**: Create new page in `frontend/src/app/admin/`
4. **Navigation**: Add link to admin layout sidebar

### Code Maintenance

- Keep TypeScript types in sync with backend
- Update documentation when adding features
- Test new features thoroughly before deploying
- Monitor error logs for issues

## Conclusion

The Admin Dashboard provides a complete administrative interface for the CIIS platform. It includes user management, issue management, and comprehensive analytics, all protected with proper authentication and authorization.

**Key Features**:

- ✅ Beautiful, responsive UI with dark theme
- ✅ Comprehensive data management
- ✅ Real-time filtering and search
- ✅ Export functionality (CSV/JSON)
- ✅ Interactive charts and visualizations
- ✅ Secure access control
- ✅ Mobile-friendly design

The implementation follows Next.js 14+ best practices, uses TypeScript for type safety, and integrates seamlessly with the existing CIIS backend infrastructure.
