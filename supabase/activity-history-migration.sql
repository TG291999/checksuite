-- Create card_activities table for audit log
CREATE TABLE card_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    type TEXT NOT NULL, -- 'move', 'create', 'update', 'checklist', 'comment'
    content TEXT, -- Human readable description or JSON
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE card_activities ENABLE ROW LEVEL SECURITY;

-- Allow read for users who can read the card (via board/workspace membership)
-- Simplified for MVP: Authenticated users can read (assuming app handles logic)
CREATE POLICY "Users can view activities" ON card_activities
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Allow insert only via server actions (service role) or authenticated users
CREATE POLICY "Users can insert activities" ON card_activities
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
