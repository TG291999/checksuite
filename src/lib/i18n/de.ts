export const de = {
    common: {
        dashboard: "Dashboard",
        processes: "Prozesse",
        boards: "Boards",
        team: "Team & Rollen",
        settings: "Einstellungen",
        create: "Erstellen",
        delete: "Löschen",
        edit: "Bearbeiten",
        save: "Speichern",
        cancel: "Abbrechen",
        back: "Zurück",
        search: "Suchen...",
        loading: "Lädt...",
        error: "Ein Fehler ist aufgetreten",
        success: "Erfolgreich",
        draft: "Entwurf",
        published: "Veröffentlicht",
        version: "Version",
        role: "Rolle",
        assignee: "Verantwortlicher",
        status: "Status",
        date: "Datum",
    },
    dashboard: {
        title: "Mein Arbeitstag",
        subtitle: "Ihr persönlicher Aufgaben-Überblick.",
        myTasks: "Meine Aufgaben",
        overdue: "Überfällig",
        due: "Fällig",
        upcoming: "Demnächst",
        openTasks: "Offene Aufgaben",
        unassigned: "Nicht zugewiesen",
        allDone: "Alles erledigt!",
        allDoneDesc: "Sie haben keine offenen Aufgaben. Starten Sie einen neuen Prozess oder erstellen Sie ein Board.",
        startProcess: "Prozess starten",
        createBoard: "Board erstellen",
        timeRanges: {
            today: "Heute",
            week: "Woche",
            month: "Monat"
        },
        empty: "Keine Aufgaben für diesen Zeitraum.",
    },
    library: {
        title: "Prozess-Bibliothek",
        subtitle: "Verwalten und starten Sie standardisierte Prozesse.",
        newTemplate: "Neue Vorlage",
        filter: {
            all: "Alle",
            myOrg: "Meine Org",
            system: "System",
            favorites: "Favoriten"
        },
        empty: "Keine Vorlagen gefunden.",
        emptyFavorites: "Markieren Sie Vorlagen mit dem Stern-Symbol, um sie hier zu sehen.",
        found: "Vorlagen gefunden",
        startDialog: {
            title: "Prozess starten",
            desc: "Erstellen Sie ein neues Board aus dieser Vorlage.",
            nameLabel: "Prozess-Name",
            assigneeLabel: "Hauptverantwortlicher",
            submit: "Starten",
            success: "Prozess gestartet – Board erstellt"
        },
        version: "Versionen",
        latest: "Aktuell",
        draft: "Entwurf"
    },
    boards: {
        title: "Boards",
        subtitle: "Aktive Boards und Workflow-Übersicht.",
        createDialog: {
            title: "Board erstellen",
            desc: "Erstellen Sie ein neues manuelles Board ohne Prozessvorlage.",
            nameLabel: "Name",
            submit: "Erstellen",
            success: "Board erstellt"
        },
        empty: "Noch keine Boards vorhanden.",
        lockedTooltip: "Board-Struktur durch Prozessvorlage gesperrt"
    },
    team: {
        title: "Team & Rollen",
        subtitle: "Benutzerverwaltung und funktionale Rollen.",
        roles: {
            title: "Funktionale Rollen",
            create: "Rolle erstellen",
            namePlaceholder: "z.B. IT-Support",
            empty: "Keine Rollen definiert."
        },
        members: {
            title: "Mitglieder",
            rolePlaceholder: "Rolle zuweisen"
        },
        accessDenied: "Zugriff verweigert",
        accessDeniedDesc: "Sie benötigen Administrator-Rechte, um das Team zu verwalten."
    }
}

export type Dictionary = typeof de
