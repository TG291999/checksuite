-- AP29: Compliance Gates
ALTER TABLE columns
ADD COLUMN IF NOT EXISTS requires_task_completion boolean DEFAULT false;

-- Add checking function? No, handled in app logic for now.
