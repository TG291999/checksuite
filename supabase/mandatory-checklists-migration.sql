-- Add is_mandatory column to checklist_items
ALTER TABLE checklist_items 
ADD COLUMN is_mandatory BOOLEAN DEFAULT FALSE;

-- Add is_mandatory column to template_checklist_items
ALTER TABLE template_checklist_items 
ADD COLUMN is_mandatory BOOLEAN DEFAULT FALSE;

-- Update the handle_new_user function or ensure upcoming boards inherit this? 
-- Actually, the createBoardFromTemplate action handles copying, so we just need to update that code later.
