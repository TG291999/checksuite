-- AP28: Link Templates to Functional Roles
ALTER TABLE process_templates
ADD COLUMN IF NOT EXISTS default_role_id uuid REFERENCES organization_roles(id) ON DELETE SET NULL;

-- Optional: Link specific Step to Role (for future granularity)
ALTER TABLE template_steps
ADD COLUMN IF NOT EXISTS default_role_id uuid REFERENCES organization_roles(id) ON DELETE SET NULL;
