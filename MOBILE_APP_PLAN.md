# Agency Mobile App Development Plan

## Overview
This document outlines the mocks, pages, and development plan for building a mobile application that allows agency admins to access and use the main features of the dashboard via mobile devices.

## Target Platform
- **Primary**: iOS and Android (React Native or Flutter recommended)
- **Alternative**: Progressive Web App (PWA) for cross-platform compatibility

---

## Mobile App Pages & Mocks

### 1. Authentication & Onboarding

#### 1.1 Login Screen
**Mock Description:**
- Email/password input fields
- "Sign in with Google" button (if applicable)
- "Forgot Password" link
- Remember me checkbox
- Clean, minimal design with agency branding

**Features:**
- Email validation
- Password visibility toggle
- Loading states during authentication
- Error handling with user-friendly messages

#### 1.2 Onboarding/Welcome Screen (First-time users)
**Mock Description:**
- 3-4 slide carousel introducing:
  - Dashboard overview
  - Task management
  - Project tracking
  - Team collaboration
- "Get Started" button on final slide

---

### 2. Main Dashboard (Home Screen)

#### 2.1 Dashboard Overview
**Mock Description:**
- Top section: Quick stats cards (4 cards in a 2x2 grid):
  - Total Projects
  - Active Tasks
  - Team Members
  - Clients
- Middle section: Activity chart (simplified line/bar chart)
  - Toggle: 7 days / 30 days / 90 days
- Bottom section: Recent activity feed
  - List of recent tasks, project updates, team activities
  - Pull-to-refresh functionality

**Key Metrics to Display:**
- Dashboard stats from `/api/dashboard` or equivalent
- Chart data showing project/task activity over time
- Recent tasks (last 10-15 items)

---

### 3. Navigation Structure

#### 3.1 Bottom Tab Navigation (Primary)
**Tabs:**
1. **Dashboard** (Home icon)
2. **Projects** (Folder icon)
3. **Tasks** (Checklist icon)
4. **Clients** (Users icon)
5. **More** (Menu icon) - Opens drawer with additional features

#### 3.2 Side Drawer Menu (Secondary Navigation)
**Sections:**
- **Main:**
  - Businesses
  - Teams
  - Files & Assets
  - Notes & Knowledge
- **Tools:**
  - AI Project Manager
  - Agency Toolkit
  - Slides Library
- **Settings:**
  - Profile
  - Notifications
  - Logout

---

### 4. Projects Module

#### 4.1 Projects List Screen
**Mock Description:**
- Search bar at top
- Filter chips: All / In Progress / Completed / Review / Planned
- Project cards in list view:
  - Project name
  - Client name
  - Status badge (color-coded)
  - Progress indicator
  - Due date (if applicable)
  - Team member avatars (first 3)
- Floating Action Button (FAB) for "New Project"
- Pull-to-refresh
- Infinite scroll or pagination

#### 4.2 Project Detail Screen
**Mock Description:**
- Header: Project name, status badge, client name
- Tabs:
  - **Overview**: Description, timeline, deliverables
  - **Tasks**: List of tasks in this project
  - **Team**: Assigned team members
  - **Timeline**: Milestones and deadlines
- Action buttons: Edit, Delete, Share
- Swipe actions: Quick status change

#### 4.3 Create/Edit Project Screen
**Mock Description:**
- Form fields:
  - Project name (required)
  - Client selection (dropdown)
  - Description (text area)
  - Status (dropdown)
  - Priority (High/Medium/Low)
  - Start date & End date (date pickers)
  - Team member selection (multi-select)
- Save/Cancel buttons

---

### 5. Tasks Module

#### 5.1 Tasks List Screen
**Mock Description:**
- Top tabs: All / High Priority / Due This Week / Completed
- Each tab shows count badge
- Search bar
- Filter options: By project, by assignee, by status
- Task cards:
  - Task title
  - Project name (if assigned)
  - Priority indicator (colored dot/bar)
  - Status badge
  - Assignee avatar + name
  - Due date (with color coding: overdue=red, due soon=yellow)
- FAB for "New Task"
- Swipe actions: Mark complete, Change priority, Delete

#### 5.2 Task Detail Screen
**Mock Description:**
- Header: Task title, priority badge, status badge
- Sections:
  - **Details**: Description, project, assignee
  - **Dates**: Created, due date, completed (if done)
  - **Activity**: Comments/logs
- Quick actions: Change status, Change priority, Reassign, Add comment
- Edit button in header

#### 5.3 Create/Edit Task Screen
**Mock Description:**
- Form fields:
  - Title (required)
  - Description
  - Project (dropdown, optional)
  - Assignee (dropdown)
  - Priority (High/Medium/Low)
  - Status (To Do/In Progress/Review/Done)
  - Due date (date picker)
- Save/Cancel buttons

---

### 6. Clients Module

#### 6.1 Clients List Screen
**Mock Description:**
- Search bar
- Filter chips: All / Active / Inactive / By Business Type
- Client cards:
  - Client name
  - Business type badge (Restaurant/Retail/etc.)
  - Status indicator
  - Contact email
  - Project count
  - Total value (if applicable)
- FAB for "New Client"
- Pull-to-refresh

#### 6.2 Client Detail Screen
**Mock Description:**
- Header: Client name, business type, status
- Tabs:
  - **Overview**: Contact info, business details, notes
  - **Projects**: List of projects for this client
  - **Activity**: Recent activity timeline
- Action buttons: Edit, Contact, Delete

#### 6.3 Create/Edit Client Screen
**Mock Description:**
- Form fields:
  - Name (required)
  - Business type (dropdown)
  - Contact email
  - Phone number
  - Address
  - Status (Active/Inactive)
  - Priority (High/Medium/Low)
  - Notes
- Save/Cancel buttons

---

### 7. Businesses Module

#### 7.1 Businesses List Screen
**Mock Description:**
- List of businesses/organizations
- Each card shows:
  - Business name
  - Business type
  - User's role in this business (if applicable)
  - Client count
  - Status
- Search and filter options
- FAB for "New Business" (Admin only)

#### 7.2 Business Detail Screen
**Mock Description:**
- Business information
- Tabs: Overview / Clients / Settings
- Action buttons based on user role

---

### 8. Teams Module

#### 8.1 Team Members List Screen
**Mock Description:**
- Search bar
- Filter by role
- Team member cards:
  - Avatar
  - Name
  - Role
  - Status (Active/Inactive)
  - Skills tags
  - Active tasks count
- FAB for "Add Team Member"

#### 8.2 Team Member Detail Screen
**Mock Description:**
- Profile header with avatar
- Information: Name, role, email, skills
- Tabs: Overview / Tasks / Projects
- Action buttons: Edit, Contact, Remove

---

### 9. Files & Assets Module

#### 9.1 Files List Screen
**Mock Description:**
- View toggle: List / Grid
- Filter: All / Images / Documents / Videos / Other
- Search bar
- File cards:
  - Thumbnail/preview
  - File name
  - File size
  - Upload date
  - Uploaded by
- FAB for "Upload File"
- Option to import from Google Drive

#### 9.2 File Preview Screen
**Mock Description:**
- Full-screen file preview
- File metadata: Name, size, type, upload date, uploaded by
- Actions: Download, Share, Delete, Edit name
- For images: Zoom, pan capabilities

#### 9.3 Upload File Screen
**Mock Description:**
- File picker (camera, gallery, files)
- Progress indicator during upload
- Option to add description/tags
- Project association (optional)

---

### 10. Notes & Knowledge Module

#### 10.1 Notes List Screen
**Mock Description:**
- Search bar
- Filter by category/tags
- Note cards:
  - Title
  - Preview text (first 2-3 lines)
  - Category/tags
  - Last modified date
  - Author
- FAB for "New Note"
- Pull-to-refresh

#### 10.2 Note Detail/Editor Screen
**Mock Description:**
- Rich text editor (markdown support)
- Title input
- Category/tag selection
- Save/Discard buttons
- Preview mode toggle

---

### 11. AI Project Manager (Chat Interface)

#### 11.1 AI Chat Screen
**Mock Description:**
- Chat interface similar to messaging apps
- Message bubbles (user messages on right, AI on left)
- Input field at bottom with send button
- Typing indicator when AI is responding
- Quick action buttons:
  - "Show my tasks"
  - "Show my projects"
  - "Create a task"
  - "Help with planning"
- Chat history persistence
- Clear conversation option

---

### 12. Settings & Profile

#### 12.1 Settings Screen
**Mock Description:**
- Sections:
  - **Account**: Profile, Change password, Email preferences
  - **Notifications**: Push notification settings
  - **App**: Theme (Light/Dark), Language, About
  - **Data**: Export data, Clear cache
- Logout button at bottom

#### 12.2 Profile Screen
**Mock Description:**
- Profile picture (editable)
- Name, email, role
- Edit button
- Account information

---

## Development Plan: What to Ask AI

### Phase 1: Project Setup & Architecture

**Ask AI:**
1. "Set up a React Native (or Flutter) project structure for an agency management mobile app with the following requirements:
   - TypeScript support
   - Navigation (React Navigation or equivalent)
   - State management (Redux/Context API/Zustand)
   - API client setup for REST endpoints
   - Authentication flow with Supabase
   - Environment configuration for dev/staging/prod"

2. "Create a folder structure for the mobile app with separate folders for:
   - Screens
   - Components (reusable UI components)
   - Services (API calls, authentication)
   - Utils (helpers, constants)
   - Types/Interfaces
   - Navigation
   - State management
   - Assets (images, icons)"

3. "Set up Supabase client for React Native with:
   - Authentication (email/password, OAuth if needed)
   - Real-time subscriptions
   - Row Level Security (RLS) handling
   - Token refresh logic
   - Session persistence"

---

### Phase 2: Authentication & Core Infrastructure

**Ask AI:**
4. "Build an authentication service that:
   - Handles login with email/password
   - Manages authentication state
   - Stores session tokens securely
   - Handles token refresh
   - Provides logout functionality
   - Redirects based on authentication status"

5. "Create a navigation structure with:
   - Auth stack (Login, Register, Forgot Password)
   - Main app stack (Dashboard, Projects, Tasks, etc.)
   - Bottom tab navigator for primary screens
   - Side drawer for secondary navigation
   - Deep linking support"

6. "Build an API service layer that:
   - Makes authenticated requests to the Next.js API endpoints
   - Handles errors gracefully
   - Implements request/response interceptors
   - Supports retry logic for failed requests
   - Caches responses where appropriate"

7. "Create reusable UI components:
   - Button variants (primary, secondary, outline)
   - Input fields with validation
   - Cards for lists
   - Badges for status/priority
   - Loading indicators
   - Empty states
   - Error states
   - Pull-to-refresh wrapper"

---

### Phase 3: Dashboard Implementation

**Ask AI:**
8. "Build the Dashboard screen that:
   - Fetches dashboard stats from `/api/dashboard` or equivalent endpoint
   - Displays 4 stat cards in a 2x2 grid
   - Shows an activity chart (use a charting library like Victory Native or Recharts)
   - Displays recent activity feed
   - Implements pull-to-refresh
   - Handles loading and error states
   - Updates in real-time using Supabase subscriptions"

9. "Create a chart component that:
   - Displays project/task activity over time
   - Supports 7/30/90 day views
   - Shows different statuses with color coding
   - Is responsive and touch-friendly"

---

### Phase 4: Projects Module

**Ask AI:**
10. "Build the Projects list screen with:
    - Fetch projects from `/api/projects` or equivalent
    - Display projects in card/list format
    - Implement search functionality
    - Add filter chips for status (All, In Progress, Completed, etc.)
    - Add pull-to-refresh
    - Implement infinite scroll or pagination
    - Add FAB for creating new project"

11. "Build the Project detail screen with:
    - Fetch project details from `/api/projects/[id]`
    - Display project information
    - Show tabs for Overview, Tasks, Team, Timeline
    - Implement swipe actions for quick status changes
    - Add edit/delete functionality"

12. "Build the Create/Edit Project screen with:
    - Form validation
    - Client dropdown (fetch from `/api/clients`)
    - Team member multi-select
    - Date pickers for start/end dates
    - Status and priority dropdowns
    - Save to API endpoint"

---

### Phase 5: Tasks Module

**Ask AI:**
13. "Build the Tasks list screen with:
    - Tab navigation (All, High Priority, Due This Week, Completed)
    - Fetch tasks from `/api/tasks` with filters
    - Display tasks in cards with priority indicators
    - Implement search and filters
    - Add swipe actions (mark complete, change priority, delete)
    - Show count badges on tabs
    - FAB for creating new task"

14. "Build the Task detail screen with:
    - Fetch task details from `/api/tasks/[id]`
    - Display all task information
    - Quick action buttons for status/priority changes
    - Comments/activity section
    - Edit functionality"

15. "Build the Create/Edit Task screen with:
    - Form with validation
    - Project dropdown
    - Assignee dropdown (fetch team members)
    - Priority and status selectors
    - Date picker for due date
    - Save to API"

---

### Phase 6: Clients Module

**Ask AI:**
16. "Build the Clients list screen with:
    - Fetch clients from `/api/clients`
    - Display in card format
    - Search functionality
    - Filter by status and business type
    - FAB for new client
    - Pull-to-refresh"

17. "Build the Client detail screen with:
    - Fetch client from `/api/clients/[id]`
    - Display client information
    - Tabs for Overview, Projects, Activity
    - Edit/delete actions"

18. "Build the Create/Edit Client screen with:
    - Form with all client fields
    - Business type dropdown
    - Validation
    - Save to API"

---

### Phase 7: Additional Modules

**Ask AI:**
19. "Build the Businesses list and detail screens:
    - Fetch from `/api/businesses`
    - Display business information
    - Show user role in each business
    - Admin-only create/edit functionality"

20. "Build the Teams module:
    - List team members from `/api/team` or equivalent
    - Display team member cards
    - Team member detail screen
    - Create/edit team member functionality"

21. "Build the Files & Assets module:
    - List files from `/api/files-assets` or equivalent
    - Grid and list view toggle
    - File upload functionality (camera, gallery, file picker)
    - File preview screen
    - Google Drive integration (if applicable)
    - Download functionality"

22. "Build the Notes & Knowledge module:
    - List notes from `/api/notes-knowledge` or equivalent
    - Rich text editor for creating/editing notes
    - Search and filter functionality
    - Category/tag management"

---

### Phase 8: AI Chat Interface

**Ask AI:**
23. "Build the AI Project Manager chat interface:
    - Chat UI with message bubbles
    - Send messages to `/api/chat` endpoint
    - Display AI responses
    - Show typing indicator
    - Persist chat history
    - Quick action buttons
    - Clear conversation option"

---

### Phase 9: Settings & Profile

**Ask AI:**
24. "Build the Settings screen:
    - Account settings
    - Notification preferences
    - App preferences (theme, language)
    - Data management options
    - Logout functionality"

25. "Build the Profile screen:
    - Display user information
    - Edit profile functionality
    - Profile picture upload
    - Change password"

---

### Phase 10: Advanced Features

**Ask AI:**
26. "Implement push notifications:
    - Set up push notification service (Firebase Cloud Messaging or similar)
    - Handle notification permissions
    - Display notifications for:
      - New task assignments
      - Task due date reminders
      - Project updates
      - Team mentions
    - Deep linking from notifications"

27. "Implement offline support:
    - Cache API responses
    - Queue actions when offline
    - Sync when connection restored
    - Show offline indicator
    - Allow viewing cached data"

28. "Add real-time updates:
    - Use Supabase real-time subscriptions
    - Update lists when data changes
    - Show live indicators for active users
    - Sync changes across devices"

29. "Implement search functionality:
    - Global search across projects, tasks, clients
    - Search suggestions
    - Recent searches
    - Search filters"

30. "Add analytics and error tracking:
    - Set up analytics (Firebase Analytics, Mixpanel, etc.)
    - Track user actions
    - Error logging (Sentry or similar)
    - Performance monitoring"

---

### Phase 11: UI/UX Polish

**Ask AI:**
31. "Implement dark mode:
    - Theme provider
    - Color scheme switching
    - Persist theme preference
    - Smooth transitions"

32. "Add animations and transitions:
    - Screen transitions
    - Loading animations
    - Pull-to-refresh animations
    - Swipe gesture feedback
    - Micro-interactions"

33. "Optimize performance:
    - Image optimization and lazy loading
    - List virtualization for long lists
    - Memoization of components
    - Code splitting
    - Reduce bundle size"

34. "Improve accessibility:
    - Screen reader support
    - Proper labels and hints
    - Keyboard navigation
    - Color contrast compliance
    - Font scaling support"

---

### Phase 12: Testing & Deployment

**Ask AI:**
35. "Set up testing:
    - Unit tests for services and utilities
    - Component tests
    - Integration tests for critical flows
    - E2E tests for main user journeys"

36. "Set up CI/CD pipeline:
    - Automated builds
    - Testing on pull requests
    - App store deployment automation
    - Version management"

37. "Prepare for app store submission:
    - App icons and splash screens
    - App store listings (descriptions, screenshots)
    - Privacy policy and terms
    - App store metadata"

---

## API Integration Points

### Base URL Configuration
- Development: `http://localhost:3000` (or your dev server)
- Production: Your production Next.js API URL

### Key API Endpoints to Integrate

1. **Authentication:**
   - `POST /api/auth/login` (or Supabase Auth)
   - `POST /api/auth/logout`
   - `POST /api/auth/refresh`

2. **Dashboard:**
   - `GET /api/dashboard/stats`
   - `GET /api/dashboard/chart-data`
   - `GET /api/dashboard/recent-tasks`

3. **Projects:**
   - `GET /api/projects`
   - `GET /api/projects/[id]`
   - `POST /api/projects`
   - `PATCH /api/projects/[id]`
   - `DELETE /api/projects/[id]`

4. **Tasks:**
   - `GET /api/tasks`
   - `GET /api/tasks/[id]`
   - `POST /api/tasks`
   - `PATCH /api/tasks/[id]`
   - `DELETE /api/tasks/[id]`

5. **Clients:**
   - `GET /api/clients`
   - `GET /api/clients/[id]`
   - `POST /api/clients`
   - `PATCH /api/clients/[id]`
   - `DELETE /api/clients/[id]`

6. **Businesses:**
   - `GET /api/businesses`
   - `GET /api/businesses/[orgId]`
   - `POST /api/businesses`
   - `PATCH /api/businesses/[orgId]`

7. **Team:**
   - `GET /api/team` (or equivalent)
   - `GET /api/team/[id]`
   - `POST /api/team`
   - `PATCH /api/team/[id]`

8. **Files:**
   - `GET /api/files-assets`
   - `POST /api/files-assets` (upload)
   - `DELETE /api/files-assets/[id]`

9. **Notes:**
   - `GET /api/notes-knowledge`
   - `GET /api/notes-knowledge/[id]`
   - `POST /api/notes-knowledge`
   - `PATCH /api/notes-knowledge/[id]`

10. **AI Chat:**
    - `POST /api/chat`

---

## Design Guidelines

### Color Scheme
- Use the same color palette as the web dashboard
- Primary colors for actions
- Status colors: Green (completed), Blue (in progress), Orange (pending), Red (overdue/urgent)

### Typography
- Clear, readable fonts
- Proper hierarchy (headings, body, captions)
- Support for font scaling

### Spacing
- Consistent padding and margins
- Touch-friendly button sizes (minimum 44x44 points)
- Adequate spacing between interactive elements

### Icons
- Use consistent icon set (Material Icons, Feather Icons, or similar)
- Appropriate sizes for mobile
- Clear visual hierarchy

---

## Technical Considerations

### State Management
- Use Redux Toolkit, Zustand, or Context API
- Cache API responses
- Optimistic updates for better UX

### Data Fetching
- Implement pagination for large lists
- Use infinite scroll or "Load More" buttons
- Cache frequently accessed data
- Implement refresh strategies

### Error Handling
- User-friendly error messages
- Retry mechanisms
- Offline error handling
- Network error detection

### Security
- Secure token storage (Keychain/Keystore)
- API request encryption (HTTPS)
- Input validation
- XSS prevention

### Performance
- Lazy load screens
- Optimize images
- Minimize API calls
- Use efficient list rendering

---

## Success Metrics

### User Engagement
- Daily active users
- Session duration
- Features usage frequency
- Task completion rate

### Performance
- App launch time
- Screen load times
- API response times
- Crash rate

### Business Metrics
- Tasks created via mobile
- Projects updated via mobile
- Client interactions
- Team collaboration metrics

---

## Future Enhancements (Post-MVP)

1. **Advanced Features:**
   - Voice input for task creation
   - Camera integration for file uploads
   - Barcode/QR code scanning
   - Location-based features
   - Calendar integration

2. **Collaboration:**
   - In-app messaging
   - @mentions in comments
   - Activity feeds
   - Team chat

3. **Analytics:**
   - Advanced reporting
   - Custom dashboards
   - Export capabilities
   - Data visualization

4. **Automation:**
   - Workflow automation
   - Smart notifications
   - AI-powered suggestions
   - Automated task assignment

---

## Notes for Mobile Developer

1. **Start with MVP**: Focus on core features first (Dashboard, Projects, Tasks, Clients)
2. **Reuse Web API**: The Next.js API endpoints should work for mobile with proper authentication
3. **Test on Real Devices**: Always test on actual iOS and Android devices, not just simulators
4. **Handle Edge Cases**: Network failures, empty states, loading states, error states
5. **Follow Platform Guidelines**: iOS Human Interface Guidelines and Material Design for Android
6. **Accessibility First**: Build with accessibility in mind from the start
7. **Performance Matters**: Mobile users expect fast, responsive apps
8. **Iterate Based on Feedback**: Gather user feedback and iterate

---

## Questions to Clarify Before Starting

1. Which mobile framework? (React Native, Flutter, Native iOS/Android)
2. Design system preference? (Material Design, iOS Human Interface Guidelines, Custom)
3. Offline functionality requirements?
4. Push notification requirements?
5. App store deployment timeline?
6. Target iOS/Android versions?
7. Budget for third-party services (analytics, crash reporting, etc.)?

---

This plan provides a comprehensive roadmap for building the mobile app. Each phase can be tackled incrementally, and the AI prompts can be customized based on the chosen technology stack and specific requirements.









