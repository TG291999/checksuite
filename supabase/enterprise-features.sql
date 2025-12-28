-- Enterprise Features Migration
-- Covers AP26 (Templates/Versions), AP27 (Instances), AP28 (Roles), AP29 (Audit)

-- 1. Enable Organization Scope for Templates
ALTER TABLE process_templates 
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES workspaces(id) ON DELETE CASCADE;

-- Update RLS for process_templates
DROP POLICY IF EXISTS "Anyone can view active templates" ON process_templates;

CREATE POLICY "Users can view system templates"
ON process_templates FOR SELECT
USING (organization_id IS NULL AND is_active = true);

CREATE POLICY "Users can view their org templates"
ON process_templates FOR SELECT
USING (is_workspace_member(organization_id));

CREATE POLICY "Admins can manage their org templates"
ON process_templates FOR ALL
USING (
    organization_id IS NOT NULL 
    AND is_workspace_member(organization_id)
    AND EXISTS (
        SELECT 1 FROM workspace_members 
        WHERE workspace_id = organization_id 
        AND user_id = auth.uid() 
        AND role IN ('owner', 'admin')
    )
);

-- 2. Template Versions
CREATE TYPE template_status AS ENUM ('draft', 'published', 'archived');

CREATE TABLE IF NOT EXISTS process_template_versions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id uuid REFERENCES process_templates(id) ON DELETE CASCADE NOT NULL,
    version_number integer NOT NULL,
    status template_status DEFAULT 'draft',
    change_summary text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    published_at timestamp with time zone,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    UNIQUE(template_id, version_number)
);

ALTER TABLE process_template_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View versions through template access"
ON process_template_versions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM process_templates pt
        WHERE pt.id = process_template_versions.template_id
        AND (
            (pt.organization_id IS NULL AND pt.is_active = true) OR
            is_workspace_member(pt.organization_id)
        )
    )
);

CREATE POLICY "Manage versions if admin"
ON process_template_versions FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM process_templates pt
        JOIN workspace_members wm ON wm.workspace_id = pt.organization_id
        WHERE pt.id = process_template_versions.template_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin')
    )
);

-- 3. Migrate Steps/Items to Versions
-- A) Add version_id to steps
ALTER TABLE template_steps 
ADD COLUMN IF NOT EXISTS version_id uuid REFERENCES process_template_versions(id) ON DELETE CASCADE;

-- B) Create Logic to Migrate Existing System Templates to Version 1
DO $$
DECLARE
    t_rec RECORD;
    v_id uuid;
BEGIN
    FOR t_rec IN SELECT * FROM process_templates LOOP
        -- Create Version 1 for each existing template
        INSERT INTO process_template_versions (template_id, version_number, status, published_at)
        VALUES (t_rec.id, 1, 'published', now())
        RETURNING id INTO v_id;

        -- Link existing steps to this version
        UPDATE template_steps 
        SET version_id = v_id 
        WHERE template_id = t_rec.id;
    END LOOP;
END $$;

-- C) Enforce version_id (Make NOT NULL after data checks, but for safety lets keep it simple first)
-- In a real prod migration we would now drop template_id, but to be safe we keep it for a moment or drop constraint.
-- Ideally: template_steps needs version_id NOT NULL and we drop template_id.

-- For now, let's allow co-existence but prioritize version_id in queries.
-- Eventually we SHOULD drop template_id to prevent confusion.
-- ALTER TABLE template_steps ALTER COLUMN version_id SET NOT NULL;
-- ALTER TABLE template_steps DROP COLUMN template_id; -- (Commented out for safety in this run)

-- 4. Functional Roles (AP28)
CREATE TABLE IF NOT EXISTS organization_roles (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id uuid REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    color text DEFAULT '#64748b',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(organization_id, name)
);

ALTER TABLE organization_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View roles if member"
ON organization_roles FOR SELECT
USING (is_workspace_member(organization_id));

CREATE POLICY "Manage roles if admin"
ON organization_roles FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM workspace_members 
        WHERE workspace_id = organization_roles.organization_id 
        AND user_id = auth.uid() 
        AND role IN ('owner', 'admin')
    )
);

-- Link members to roles (M:N via join table or simple array? Let's use array for simplicity or Join table for strictness)
-- User asked for: "Membership kann optional eine funktionale Rolle haben"
-- Let's add a `functional_role_id` to workspace_members for 1:1 ease, or `functional_role_ids` for multiple.
ALTER TABLE workspace_members 
ADD COLUMN IF NOT EXISTS functional_role_id uuid REFERENCES organization_roles(id) ON DELETE SET NULL;

-- 5. Audit Events (AP29)
CREATE TABLE IF NOT EXISTS audit_events (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id uuid REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
    actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type text NOT NULL, -- 'OVERRIDE', 'START_PROCESS', etc
    entity_type text NOT NULL, -- 'board', 'card', 'step'
    entity_id uuid NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
ON audit_events FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM workspace_members 
        WHERE workspace_id = audit_events.organization_id 
        AND user_id = auth.uid() 
        AND role IN ('owner', 'admin')
    )
);

-- 6. Board Instantiation Link (AP27)
ALTER TABLE boards 
ADD COLUMN IF NOT EXISTS origin_template_id uuid REFERENCES process_templates(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS origin_template_version_id uuid REFERENCES process_template_versions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_structure_locked boolean DEFAULT false;

-- 7. Favorites (AP30)
CREATE TABLE IF NOT EXISTS template_favorites (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    template_id uuid REFERENCES process_templates(id) ON DELETE CASCADE NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, template_id)
);

ALTER TABLE template_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their favorites"
ON template_favorites FOR ALL
USING (auth.uid() = user_id);
