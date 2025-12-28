export const metadata = {
    title: "Datenschutz | CheckSuite",
    description: "Informationen zum Datenschutz bei CheckSuite.",
}

export default function DatenschutzPage() {
    return (
        <div className="container mx-auto max-w-3xl px-6 py-20 font-sans text-slate-900">
            <h1 className="text-4xl font-bold mb-8">Datenschutzerklärung</h1>

            <div className="prose prose-slate max-w-none">
                <h2 className="text-2xl font-bold mt-8 mb-4">1. Datenschutz auf einen Blick</h2>
                <h3 className="text-lg font-bold mt-4">Allgemeine Hinweise</h3>
                <p>Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen...</p>

                <h2 className="text-2xl font-bold mt-8 mb-4">2. Hosting</h2>
                <p>Wir hosten die Inhalte unserer Website bei folgendem Anbieter:</p>
                <h3 className="text-lg font-bold mt-4">Vercel</h3>
                <p>Anbieter ist die Vercel Inc., 340 S Lemon Ave #4133 Walnut, CA 91789, USA. Wenn Sie unsere Website besuchen, erfasst Vercel verschiedene Logfiles inklusive Ihrer IP-Adressen...</p>

                <h2 className="text-2xl font-bold mt-8 mb-4">3. Allgemeine Hinweise und Pflichtinformationen</h2>
                <h3 className="text-lg font-bold mt-4">Datenschutz</h3>
                <p>Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend den gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung...</p>

                <h3 className="text-lg font-bold mt-4">Hinweis zur verantwortlichen Stelle</h3>
                <p>
                    Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:<br /><br />
                    CheckSuite GmbH<br />
                    Musterstraße 123<br />
                    10115 Berlin<br /><br />
                    E-Mail: kontakt@checksuite.de
                </p>

                <h2 className="text-2xl font-bold mt-8 mb-4">4. Datenerfassung auf dieser Website</h2>
                <h3 className="text-lg font-bold mt-4">Cookies</h3>
                <p>Unsere Internetseiten verwenden so genannte „Cookies“. Cookies sind kleine Textdateien und richten auf Ihrem Endgerät keinen Schaden an...</p>

                <h3 className="text-lg font-bold mt-4">Anfrage per E-Mail, Telefon oder Telefax</h3>
                <p>Wenn Sie uns per E-Mail, Telefon oder Telefax kontaktieren, wird Ihre Anfrage inklusive aller daraus hervorgehenden personenbezogenen Daten (Name, Anfrage) zum Zwecke der Bearbeitung Ihres Anliegens bei uns gespeichert und verarbeitet...</p>
            </div>

            <div className="mt-12 pt-8 border-t border-slate-200">
                <a href="/" className="text-[#6D28D9] font-medium hover:underline">← Zurück zur Startseite</a>
            </div>
        </div>
    )
}
