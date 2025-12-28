-- AP22: Priority System
-- 1. Add priority column to cards
ALTER TABLE cards 
ADD COLUMN priority text CHECK (priority IN ('high', 'normal', 'low')) DEFAULT 'normal';

-- 2. Create index for fast dashboard filtering (My Day queries)
-- We frequently query by: assigned_to, status (not done), due_date, and order by priority
CREATE INDEX idx_dashboard_cards 
ON cards (assigned_to, column_id, due_date, priority);

-- Note: we use column_id to determine status (e.g. check if column is 'Done')
-- Ideally we might want a denormalized status, but for now filtering by column name via join is standard.
-- This index helps standard lookups.
