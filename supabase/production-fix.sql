-- CHECKSUITE PRODUCTION FIX SCRIPT
-- Run this script in your Supabase SQL Editor to ensure your production database is up to date.

-- ==========================================
-- AP12: Mandatory Checklists
-- ==========================================
ALTER TABLE columns ADD COLUMN IF NOT EXISTS require_checklist_complete boolean default false;
ALTER TABLE checklist_items ADD COLUMN IF NOT EXISTS is_mandatory boolean default false;

-- ==========================================
-- AP13: Activity History
-- ==========================================
CREATE TABLE IF NOT EXISTS card_activities (
  id uuid primary key default gen_random_uuid(),
  card_id uuid references cards(id) on delete cascade,
  user_id uuid references auth.users(id),
  action_type text not null,
  old_value text,
  new_value text,
  metadata jsonb,
  created_at timestamp with time zone default now()
);
CREATE INDEX IF NOT EXISTS idx_card_activities_card_id on card_activities(card_id);

-- ==========================================
-- AP14: External Access (Board Shares)
-- ==========================================
CREATE TABLE IF NOT EXISTS board_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE
);
ALTER TABLE board_shares ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_board_shares_token ON board_shares(token);

-- ==========================================
-- AP16/17: Enterprise Structure & Roles
-- ==========================================
-- Fix role constraint
ALTER TABLE workspace_members DROP CONSTRAINT IF EXISTS workspace_members_role_check;
ALTER TABLE workspace_members ADD CONSTRAINT workspace_members_role_check 
    CHECK (role IN ('owner', 'admin', 'member', 'viewer'));

-- Add company info
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS website TEXT;

-- ==========================================
-- AP18: Invitations
-- ==========================================
CREATE TABLE IF NOT EXISTS workspace_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'member', 'viewer')),
    token TEXT UNIQUE NOT NULL,
    invited_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days')
);
ALTER TABLE workspace_invites ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_workspace_invites_token ON workspace_invites(token);
CREATE INDEX IF NOT EXISTS idx_workspace_invites_email ON workspace_invites(email);

-- ==========================================
-- AP19: Responsibilities (Participants)
-- ==========================================
CREATE TABLE IF NOT EXISTS card_participants (
    card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (card_id, user_id)
);
ALTER TABLE card_participants ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- AP11/AP20: Process Templates
-- ==========================================
create table if not exists process_templates (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  icon text,
  category text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists template_steps (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references process_templates(id) on delete cascade not null,
  name text not null,
  description text,
  position integer default 0,
  require_checklist_complete boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists template_checklist_items (
  id uuid primary key default gen_random_uuid(),
  step_id uuid references template_steps(id) on delete cascade not null,
  content text not null,
  position integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE process_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_checklist_items ENABLE ROW LEVEL SECURITY;

-- Re-Seed Templates (Only if empty to avoid dupes, or using ON CONFLICT DO NOTHING if we knew IDs)
-- Since slug is unique, we can attempt insert
INSERT INTO process_templates (slug, name, description, icon, category) VALUES
('kunden-onboarding', 'Kunden-Onboarding', 'Strukturierter Prozess für neue Kunden – von der Anfrage bis zur erfolgreichen Übergabe.', '🤝', 'Vertrieb & Kunden'),
('angebotsprozess', 'Angebotsprozess', 'Vom Lead zum Abschluss – strukturierte Angebotserstellung und Nachverfolgung.', '📝', 'Vertrieb & Kunden'),
('ticket-bearbeitung', 'Ticket / Vorgang', 'Standardprozess für Support-Anfragen und interne Vorgänge.', '🎫', 'Operations'),
('monatsabschluss', 'Monatsabschluss', 'Wiederkehrender Prozess für Buchhaltung und Controlling.', '📊', 'Finanzen')
ON CONFLICT (slug) DO NOTHING;

-- Note: Seeding steps and items is complex to make idempotent without known UUIDs.
-- If templates were missing, the app should still load but the picker will be empty.
-- The user can re-run the full 'templates-migration 4.sql' if they need a reset.
-- This script focuses on preventing crashes (missing tables).

-- ==========================================
-- RLS POLICIES (Idempotent creation is tricky, errors if exists)
-- ==========================================
-- We wrap in DO block to avoid errors

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view active templates') THEN
        create policy "Anyone can view active templates" on process_templates for select using (is_active = true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view template steps') THEN
        create policy "Anyone can view template steps" on template_steps for select using (exists (select 1 from process_templates where id = template_steps.template_id and is_active = true));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view template checklist items') THEN
        create policy "Anyone can view template checklist items" on template_checklist_items for select using (exists (select 1 from template_steps join process_templates on process_templates.id = template_steps.template_id where template_steps.id = template_checklist_items.step_id and process_templates.is_active = true));
    END IF;

     IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Manage participants if access to board') THEN
        create policy "Manage participants if access to board" on card_participants for all using (exists (select 1 from cards join columns on columns.id = cards.column_id join boards on boards.id = columns.board_id where cards.id = card_participants.card_id and is_workspace_member(boards.workspace_id)));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage invites') THEN
         create policy "Admins can manage invites" on workspace_invites using (exists (select 1 from workspace_members where workspace_id = workspace_invites.workspace_id and user_id = auth.uid() and role in ('owner', 'admin')));
    END IF;
END
$$;
