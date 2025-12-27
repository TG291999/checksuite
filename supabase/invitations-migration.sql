-- Create invitations table
CREATE TABLE workspace_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'member', 'viewer')),
    token TEXT UNIQUE NOT NULL,
    invited_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days')
);

-- RLS
ALTER TABLE workspace_invites ENABLE ROW LEVEL SECURITY;

-- Workspace admins/owners can view and create invites
CREATE POLICY "Admins can manage invites" ON workspace_invites
    USING (
        EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_id = workspace_invites.workspace_id
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

-- Index for token lookup (public access needs separate function or admin client)
CREATE INDEX idx_workspace_invites_token ON workspace_invites(token);
CREATE INDEX idx_workspace_invites_email ON workspace_invites(email);
