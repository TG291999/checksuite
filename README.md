# CheckSuite 🚀

**CheckSuite** ist ein modernes Kanban-Board für agile Teams – entwickelt als MVP mit Fokus auf "Process Hygiene" und deutschem Datenschutz-Standard (Self-Hosted/Supabase).

## Features

- ✅ Board & Card Management (Kanban-Style)
- ✅ Drag & Drop
- ✅ Checklisten pro Karte
- ✅ Inline-Editing (Titel, Beschreibung, Checklisten)
- ✅ Spalten erstellen, umbenennen, löschen
- ✅ Boards erstellen & löschen
- ✅ Email/Password Auth
- ✅ Deutsche Lokalisierung

## Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS, shadcn/ui
- **Backend:** Supabase (Auth + Postgres)
- **Drag & Drop:** @dnd-kit

## Setup

```bash
git clone https://github.com/TG291999/checksuite.git
cd checksuite
npm install
```

Erstelle `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

```bash
npm run dev
```

## License

MIT
