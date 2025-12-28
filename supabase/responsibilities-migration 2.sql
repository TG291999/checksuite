-- Create participants table
CREATE TABLE card_participants (
    card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (card_id, user_id)
);

-- RLS
ALTER TABLE card_participants ENABLE ROW LEVEL SECURITY;

-- Policies (Same as cards/checklist items - accessible if you can access the board)
CREATE POLICY "Manage participants if access to board"
  ON card_participants FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM cards
      JOIN columns ON columns.id = cards.column_id
      JOIN boards ON boards.id = columns.board_id
      WHERE cards.id = card_participants.card_id
      AND is_workspace_member(boards.workspace_id)
    )
  );

-- Helper for easier fetching? 
-- Not strictly needed, we can just select via foreign key relation.
