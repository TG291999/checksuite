# Test Plan

## 1. Setup
- Framework: Playwright
- Environment: Local (`npm run dev`) and Build (`npm run build`)

## 2. E2E Journeys (Critical Paths)

### J1: Authentication & Dashboard
- User can log in.
- Ridesct to `/dashboard`.
- Dashboard loads without errors.

### J2: Board Operations
- Create new Board (Manual).
- Open Board.
- Create Column.
- Create Card in Column A.
- **Move Card from Column A to empty Column B (Regression Test).**
- Reload page -> Card persists in Column B.

### J3: Template Management
- Navigate to Library.
- Create New Template.
- Add Steps/Checklist items.
- Save/Publish.
- **Verify redirection to Detail/List (Regression Test).**
- Instantiate Process from Template.

### J4: Team Management
- View members.
- Change a member's role.

## 3. Smoke Tests
- Build verification (`npm run build`).
- No console errors on main routes.
- 404 handling for unknown routes.
