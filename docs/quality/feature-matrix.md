# Feature Matrix & Status

| Route | Feature | Status | Notes |
|-------|---------|--------|-------|
| `/` | Landing Redirect | OK | Redirects to /login |
| `/login` | Auth Login | OK | |
| `/register` | Auth Register | OK | |
| `/dashboard` | My Day Overview | OK | Localized, Empty States preset |
| `/dashboard` | Stats | OK | |
| `/dashboard/library` | Template List | OK | Search & Filter implemented |
| `/dashboard/library` | Create Template | OK | Fixed (New Page) |
| `/dashboard/library/[id]` | Template Detail | CHECK | Needs verification |
| `/dashboard/boards` | Board List | OK | Create Modal works |
| `/boards/[id]` | Board Canvas | OK | |
| `/boards/[id]` | Drag & Drop | BUG | Cards cannot be dropped in empty columns |
| `/boards/[id]` | Add Card | OK | |
| `/dashboard/team` | Team List | OK | Role assignment works |
| `/dashboard/settings` | Settings | UNKNOWN | Need to verify existence and content |

## Known Bugs
1. **Drag & Drop**: Cannot drop card into empty column.
2. **Template Creation**: Flow may end in a dead end.
