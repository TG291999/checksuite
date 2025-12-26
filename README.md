# Flowboard 🚀

**Flowboard** ist ein modernes Kanban-Board für agile Teams – entwickelt als MVP mit Fokus auf "Process Hygiene" und deutschem Datenschutz-Standard (Self-Hosted/Supabase).

## Features

- **Pipeline-Management**: Organisiere Aufgaben in Spalten (To Do, In Progress, Done).
- **Drag & Drop**: Intuitive Bedienung mit sofortigem Feedback.
- **Checklisten (USP)**: Detaillierte Aufgabenunterteilung mit Fortschrittsanzeige.
- **Fälligkeiten**: Visuelle Warnungen bei überfälligen Aufgaben.
- **Teams**: Workspace-basierte Datenhaltung.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React, Tailwind CSS, shadcn/ui.
- **Backend**: Supabase (PostgreSQL, Auth, Realtime).
- **Interactions**: `@dnd-kit` für Drag & Drop, Server Actions für Mutationen.

## Setup

### 1. Voraussetzungen
- Node.js 18+
- Ein Supabase-Projekt (kostenlos erstellbar auf supabase.com)

### 2. Installation
```bash
git clone <repo-url>
cd flowboard
npm install
```

### 3. Environment Variables
Erstelle eine `.env.local` Datei:
```ini
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Datenbank Setup
Führe den Inhalt von `supabase/schema.sql` im Supabase SQL Editor aus, um Tabellen, Policies und Trigger zu erstellen.

### 5. Starten
```bash
npm run dev
```
Besuche `http://localhost:3000`.

## Lizenz
MIT
