-- =====================================================
-- AP11: Process Templates - Database Schema Extension
-- =====================================================
-- Run this migration AFTER the base schema.sql

-- 1. Process Templates Table (System-Level, not user-owned)
create table if not exists process_templates (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null,
  description text,
  icon text, -- emoji
  category text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Template Steps (Pipeline Stages)
create table if not exists template_steps (
  id uuid primary key default uuid_generate_v4(),
  template_id uuid references process_templates(id) on delete cascade not null,
  name text not null,
  description text,
  position integer default 0,
  require_checklist_complete boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Template Checklist Items (per Step)
create table if not exists template_checklist_items (
  id uuid primary key default uuid_generate_v4(),
  step_id uuid references template_steps(id) on delete cascade not null,
  content text not null,
  position integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table process_templates enable row level security;
alter table template_steps enable row level security;
alter table template_checklist_items enable row level security;

-- RLS Policies: Templates are PUBLIC READ (no user check needed)
create policy "Anyone can view active templates"
  on process_templates for select
  using (is_active = true);

create policy "Anyone can view template steps"
  on template_steps for select
  using (
    exists (
      select 1 from process_templates
      where id = template_steps.template_id
      and is_active = true
    )
  );

create policy "Anyone can view template checklist items"
  on template_checklist_items for select
  using (
    exists (
      select 1 from template_steps
      join process_templates on process_templates.id = template_steps.template_id
      where template_steps.id = template_checklist_items.step_id
      and process_templates.is_active = true
    )
  );

-- =====================================================
-- SEED DATA: Initial Process Templates
-- =====================================================

-- Template 1: Kunden-Onboarding
insert into process_templates (slug, name, description, icon, category) values
('kunden-onboarding', 'Kunden-Onboarding', 'Strukturierter Prozess für neue Kunden – von der Anfrage bis zur erfolgreichen Übergabe.', '🤝', 'Vertrieb & Kunden');

insert into template_steps (template_id, name, description, position, require_checklist_complete) values
((select id from process_templates where slug = 'kunden-onboarding'), 'Anfrage', 'Erste Kontaktaufnahme erfassen', 0, false),
((select id from process_templates where slug = 'kunden-onboarding'), 'Qualifizierung', 'Bedarf und Eignung prüfen', 1, true),
((select id from process_templates where slug = 'kunden-onboarding'), 'Vertrag', 'Vertragserstellung und Unterschrift', 2, true),
((select id from process_templates where slug = 'kunden-onboarding'), 'Setup', 'Technische Einrichtung', 3, true),
((select id from process_templates where slug = 'kunden-onboarding'), 'Übergabe', 'Abschluss und Dokumentation', 4, false);

-- Checklists for Kunden-Onboarding
insert into template_checklist_items (step_id, content, position) values
-- Qualifizierung
((select id from template_steps where name = 'Qualifizierung' and template_id = (select id from process_templates where slug = 'kunden-onboarding')), 'Erstgespräch geführt', 0),
((select id from template_steps where name = 'Qualifizierung' and template_id = (select id from process_templates where slug = 'kunden-onboarding')), 'Anforderungen dokumentiert', 1),
((select id from template_steps where name = 'Qualifizierung' and template_id = (select id from process_templates where slug = 'kunden-onboarding')), 'Budget geklärt', 2),
-- Vertrag
((select id from template_steps where name = 'Vertrag' and template_id = (select id from process_templates where slug = 'kunden-onboarding')), 'Angebot erstellt', 0),
((select id from template_steps where name = 'Vertrag' and template_id = (select id from process_templates where slug = 'kunden-onboarding')), 'Vertrag unterschrieben', 1),
((select id from template_steps where name = 'Vertrag' and template_id = (select id from process_templates where slug = 'kunden-onboarding')), 'Rechnung gestellt', 2),
-- Setup
((select id from template_steps where name = 'Setup' and template_id = (select id from process_templates where slug = 'kunden-onboarding')), 'Zugänge eingerichtet', 0),
((select id from template_steps where name = 'Setup' and template_id = (select id from process_templates where slug = 'kunden-onboarding')), 'Schulung durchgeführt', 1),
((select id from template_steps where name = 'Setup' and template_id = (select id from process_templates where slug = 'kunden-onboarding')), 'Testlauf erfolgreich', 2);

-- Template 2: Angebotsprozess
insert into process_templates (slug, name, description, icon, category) values
('angebotsprozess', 'Angebotsprozess', 'Vom Lead zum Abschluss – strukturierte Angebotserstellung und Nachverfolgung.', '📝', 'Vertrieb & Kunden');

insert into template_steps (template_id, name, description, position, require_checklist_complete) values
((select id from process_templates where slug = 'angebotsprozess'), 'Lead', 'Neuer Interessent', 0, false),
((select id from process_templates where slug = 'angebotsprozess'), 'Bedarfsanalyse', 'Anforderungen ermitteln', 1, true),
((select id from process_templates where slug = 'angebotsprozess'), 'Angebot', 'Angebot erstellen und senden', 2, true),
((select id from process_templates where slug = 'angebotsprozess'), 'Verhandlung', 'Rückfragen und Anpassungen', 3, false),
((select id from process_templates where slug = 'angebotsprozess'), 'Abschluss', 'Gewonnen oder verloren', 4, false);

insert into template_checklist_items (step_id, content, position) values
((select id from template_steps where name = 'Bedarfsanalyse' and template_id = (select id from process_templates where slug = 'angebotsprozess')), 'Kundenbedarf verstanden', 0),
((select id from template_steps where name = 'Bedarfsanalyse' and template_id = (select id from process_templates where slug = 'angebotsprozess')), 'Technische Anforderungen geklärt', 1),
((select id from template_steps where name = 'Angebot' and template_id = (select id from process_templates where slug = 'angebotsprozess')), 'Kalkulation erstellt', 0),
((select id from template_steps where name = 'Angebot' and template_id = (select id from process_templates where slug = 'angebotsprozess')), 'Angebot versendet', 1);

-- Template 3: Ticket / Vorgangsbearbeitung
insert into process_templates (slug, name, description, icon, category) values
('ticket-bearbeitung', 'Ticket / Vorgang', 'Standardprozess für Support-Anfragen und interne Vorgänge.', '🎫', 'Operations');

insert into template_steps (template_id, name, description, position, require_checklist_complete) values
((select id from process_templates where slug = 'ticket-bearbeitung'), 'Eingang', 'Anfrage erhalten', 0, false),
((select id from process_templates where slug = 'ticket-bearbeitung'), 'Analyse', 'Problem verstehen', 1, true),
((select id from process_templates where slug = 'ticket-bearbeitung'), 'Bearbeitung', 'Lösung umsetzen', 2, false),
((select id from process_templates where slug = 'ticket-bearbeitung'), 'Review', 'Qualitätsprüfung', 3, true),
((select id from process_templates where slug = 'ticket-bearbeitung'), 'Erledigt', 'Abgeschlossen', 4, false);

insert into template_checklist_items (step_id, content, position) values
((select id from template_steps where name = 'Analyse' and template_id = (select id from process_templates where slug = 'ticket-bearbeitung')), 'Problem reproduziert', 0),
((select id from template_steps where name = 'Analyse' and template_id = (select id from process_templates where slug = 'ticket-bearbeitung')), 'Ursache identifiziert', 1),
((select id from template_steps where name = 'Review' and template_id = (select id from process_templates where slug = 'ticket-bearbeitung')), 'Lösung getestet', 0),
((select id from template_steps where name = 'Review' and template_id = (select id from process_templates where slug = 'ticket-bearbeitung')), 'Kunde informiert', 1);

-- Template 4: Monatsabschluss
insert into process_templates (slug, name, description, icon, category) values
('monatsabschluss', 'Monatsabschluss', 'Wiederkehrender Prozess für Buchhaltung und Controlling.', '📊', 'Finanzen');

insert into template_steps (template_id, name, description, position, require_checklist_complete) values
((select id from process_templates where slug = 'monatsabschluss'), 'Vorbereitung', 'Unterlagen sammeln', 0, true),
((select id from process_templates where slug = 'monatsabschluss'), 'Buchungen', 'Alle Buchungen erfassen', 1, true),
((select id from process_templates where slug = 'monatsabschluss'), 'Abstimmung', 'Konten abstimmen', 2, true),
((select id from process_templates where slug = 'monatsabschluss'), 'Prüfung', 'Finale Kontrolle', 3, true),
((select id from process_templates where slug = 'monatsabschluss'), 'Abschluss', 'Monat geschlossen', 4, false);

insert into template_checklist_items (step_id, content, position) values
((select id from template_steps where name = 'Vorbereitung' and template_id = (select id from process_templates where slug = 'monatsabschluss')), 'Bankbelege vollständig', 0),
((select id from template_steps where name = 'Vorbereitung' and template_id = (select id from process_templates where slug = 'monatsabschluss')), 'Rechnungen gesammelt', 1),
((select id from template_steps where name = 'Vorbereitung' and template_id = (select id from process_templates where slug = 'monatsabschluss')), 'Belege digitalisiert', 2),
((select id from template_steps where name = 'Buchungen' and template_id = (select id from process_templates where slug = 'monatsabschluss')), 'Eingangsrechnungen gebucht', 0),
((select id from template_steps where name = 'Buchungen' and template_id = (select id from process_templates where slug = 'monatsabschluss')), 'Ausgangsrechnungen gebucht', 1),
((select id from template_steps where name = 'Buchungen' and template_id = (select id from process_templates where slug = 'monatsabschluss')), 'Bankbewegungen zugeordnet', 2),
((select id from template_steps where name = 'Abstimmung' and template_id = (select id from process_templates where slug = 'monatsabschluss')), 'Debitorenkonten abgestimmt', 0),
((select id from template_steps where name = 'Abstimmung' and template_id = (select id from process_templates where slug = 'monatsabschluss')), 'Kreditorenkonten abgestimmt', 1),
((select id from template_steps where name = 'Prüfung' and template_id = (select id from process_templates where slug = 'monatsabschluss')), 'USt-Voranmeldung erstellt', 0),
((select id from template_steps where name = 'Prüfung' and template_id = (select id from process_templates where slug = 'monatsabschluss')), 'BWA geprüft', 1);
