-- Create board_shares table for public access tokens
CREATE TABLE board_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE, -- Random secure token
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ, -- Optional expiration
    is_active BOOLEAN DEFAULT TRUE
);

-- RLS
ALTER TABLE board_shares ENABLE ROW LEVEL SECURITY;

-- Board owners can create shares
CREATE POLICY "Board owners can manage shares" ON board_shares
    USING (
        EXISTS (
            SELECT 1 FROM boards b
            JOIN workspace_members wm ON b.workspace_id = wm.workspace_id
            WHERE b.id = board_shares.board_id
            AND wm.user_id = auth.uid()
        )
    );

-- Index for fast lookup
CREATE INDEX idx_board_shares_token ON board_shares(token);
