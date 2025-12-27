-- Fix role constraint to include 'owner' and 'viewer'
ALTER TABLE workspace_members DROP CONSTRAINT IF EXISTS workspace_members_role_check;

ALTER TABLE workspace_members ADD CONSTRAINT workspace_members_role_check 
    CHECK (role IN ('owner', 'admin', 'member', 'viewer'));

-- Add description/website to workspaces (now "Companies")
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS website TEXT;
